import { useAuth } from "@/hooks/use-auth";
import { useDiseaseDistribution } from "@/hooks/use-stats";
import { usePatients } from "@/hooks/use-patients";
import { StatCard } from "@/components/StatCard";
import { PatientManagement } from "@/components/PatientManagement";
import { Users, Activity, Stethoscope, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const { data: stats } = useDiseaseDistribution();
  const { data: patients } = usePatients();

  if (!user || user.role !== 'admin') {
    setLocation('/');
    return null;
  }

  // Calculate quick stats
  const totalPatients = patients?.length || 0;
  const criticalCases = patients?.filter(p => p.urgency === 'critical' || p.urgency === 'high').length || 0;
  const transporting = patients?.filter(p => p.status === 'transporting').length || 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold font-display text-slate-800">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium">Hello, {user.name}</span>
          <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation('/'); }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Active Cases"
            value={totalPatients}
            icon={<Users className="h-5 w-5" />}
            description="Patients currently in system"
          />
          <StatCard
            title="Critical Condition"
            value={criticalCases}
            icon={<Activity className="h-5 w-5" />}
            description="Requires immediate attention"
          />
          <StatCard
            title="Incoming Transport"
            value={transporting}
            icon={<Stethoscope className="h-5 w-5" />}
            description="Ambulances en route"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Disease Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full shadow-lg border-none">
              <CardHeader>
                <CardTitle>Disease Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Loading stats...
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Patients List */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full shadow-lg border-none overflow-hidden">
              <CardHeader>
                <CardTitle>Recent Patients</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients?.slice(0, 5).map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              patient.urgency === 'critical' ? 'bg-red-500' :
                                patient.urgency === 'high' ? 'bg-orange-500' :
                                  'bg-green-500'
                            }>
                              {patient.urgency?.toUpperCase() || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize text-slate-500">{patient.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Patient Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PatientManagement />
        </motion.div>
      </main>
    </div>
  );
}
