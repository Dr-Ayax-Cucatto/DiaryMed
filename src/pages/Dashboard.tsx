import { useEffect, useState } from 'react';
import { blink } from '../lib/blink';
import type { BlinkUser } from '@blinkdotnew/sdk';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Clock, Brain, Target, TrendingUp, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

interface DashboardProps {
  user: BlinkUser;
}

interface Stats {
  totalPatients: number;
  totalMinutes: number;
  mostCommonCategory: string;
  activeGoals: number;
}

interface PatientData {
  id?: string;
  userId: string;
  userEmail: string;
  anonymousId: string;
  consultationDate: string;
  consultationTime: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  observations: string;
  durationMinutes: number;
  lessonsLearned: string;
  category: string;
  followUpDate: string;
  createdAt?: any;
}

export function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalMinutes: 0,
    mostCommonCategory: 'N/A',
    activeGoals: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  // 👇 ARREGLADO: Ahora filtra por usuario (sin orderBy para evitar índice)
  useEffect(() => {
    const userEmail = user.email || user.id;
    
    // 🐛 DEBUG - Información del usuario
    console.log('==================== DEBUG DASHBOARD ====================');
    console.log('👤 Usuario completo:', user);
    console.log('📧 user.email:', user.email);
    console.log('🆔 user.id:', user.id);
    console.log('🔍 Buscando pacientes con userEmail:', userEmail);
    console.log('=========================================================');
    
    // Crear query con filtro por userEmail (SIN orderBy para evitar error de índice)
    const q = query(
      collection(db, 'patients'),
      where('userEmail', '==', userEmail) // 👈 Solo filtro, sin ordenar
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('==================== FIREBASE RESPONSE ====================');
        console.log('📊 Total documentos recibidos:', snapshot.docs.length);
        
        snapshot.docs.forEach((doc, index) => {
          console.log(`Paciente ${index + 1}:`, {
            id: doc.id,
            data: doc.data()
          });
        });
        
        const patients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as PatientData[];
        
        console.log('✅ Pacientes procesados:', patients);
        console.log('===========================================================');
        
        // Ordenar manualmente en el cliente por fecha (más reciente primero)
        patients.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        calculateStats(patients);
      },
      (error) => {
        console.error('❌ Error al cargar pacientes:', error);
      }
    );

    return () => {
      console.log('🛑 Limpiando listener de Firebase');
      unsubscribe();
    };
  }, [user.email, user.id]); // 👈 Dependencias actualizadas

  // Cargar metas activas de Blink
  useEffect(() => {
    fetchGoals();
  }, [user.id]);

  const fetchGoals = async () => {
    try {
      const allGoals = await blink.db.professionalGoals.list({
        where: { userId: user.id }
      });
      const activeGoals = allGoals.filter((g: any) => g.status === 'pending');
      
      setStats(prev => ({
        ...prev,
        activeGoals: activeGoals.length,
      }));
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const calculateStats = (patients: PatientData[]) => {
    console.log('🧮 Calculando estadísticas con', patients.length, 'pacientes');
    
    // Calculate stats
    const totalPatients = patients.length;
    const totalMinutes = patients.reduce((acc, p) => {
      const minutes = Number(p.durationMinutes) || 0;
      return acc + minutes;
    }, 0);
    
    console.log('⏱️ Total minutos:', totalMinutes);
    
    const categories: Record<string, number> = {};
    patients.forEach((p) => {
      if (p.category) {
        categories[p.category] = (categories[p.category] || 0) + 1;
      }
    });
    
    const mostCommonCategory = Object.entries(categories).length > 0
      ? Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    console.log('📈 Categoría más común:', mostCommonCategory);

    setStats(prev => ({
      ...prev,
      totalPatients,
      totalMinutes,
      mostCommonCategory,
    }));

    // Prepare weekly data for chart
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const chartData = last7Days.map(date => {
      const count = patients.filter((p) => p.consultationDate === date).length;
      const dayName = new Date(date).toLocaleDateString('es-ES', { weekday: 'short' });
      return {
        date: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        pacientes: count,
      };
    });

    console.log('📊 Datos del gráfico:', chartData);
    setWeeklyData(chartData);
  };

  const statCards = [
    { label: 'Pacientes Totales', value: stats.totalPatients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Tiempo Invertido', value: `${stats.totalMinutes} min`, icon: Clock, color: 'text-teal-500', bg: 'bg-teal-50' },
    { label: 'Categoría Común', value: stats.mostCommonCategory, icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Metas Activas', value: stats.activeGoals, icon: Target, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-foreground font-serif">Bienvenido, Dr. {user.displayName}</h1>
        <p className="text-muted-foreground mt-2">Aquí tienes un resumen de tu actividad profesional reciente.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-elegant hover:scale-[1.02] transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-2xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Actividad Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="pacientes" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPacientes)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Cargando datos...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="text-xl font-serif">Inspiración Diaria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 italic text-primary/80 relative">
              <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
              El arte de la medicina consiste en entretener al paciente mientras la naturaleza cura la enfermedad.
              <p className="mt-4 text-sm font-bold not-italic">— Voltaire</p>
            </div>
            
            <div className="space-y-4 pt-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Consejo del día</h4>
              <p className="text-sm text-foreground">
                Recuerda registrar tus reflexiones diarias. El aprendizaje continuo es la base de la excelencia médica.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
