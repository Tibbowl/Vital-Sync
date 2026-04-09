import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, HeartPulse, ArrowLeft, Loader2, Bot } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const assessmentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.coerce.number().min(1, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  symptoms: z.string().min(10, "Please describe your symptoms in more detail"),
});

type AssessmentForm = z.infer<typeof assessmentSchema>;

export default function PublicAIAssessment() {
  const [result, setResult] = useState<any>(null);

  const form = useForm<AssessmentForm>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      name: "",
      age: 0,
      gender: "",
      symptoms: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AssessmentForm) => {
      const res = await apiRequest("POST", "/api/ai/predict", data);
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const onSubmit = (data: AssessmentForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-emerald-950">VITAL SYNC</h1>
            <p className="text-xs text-muted-foreground font-medium">Public AI Assessment</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 py-1 px-3 gap-1.5 font-medium rounded-full mb-4">
                <Bot className="h-3.5 w-3.5" />
                AI Doctor Assistant
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 font-display">How are you feeling today?</h2>
              <p className="text-slate-600">
                Describe your symptoms and provide basic information for an instant AI-powered health assessment. 
                <span className="block mt-2 font-medium text-emerald-700">This tool is for preliminary assessment only and does not replace professional medical advice.</span>
              </p>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <Input placeholder="Male/Female/Other" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="symptoms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symptoms</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your symptoms (e.g., headache, fever for 2 days, etc.)" 
                              className="min-h-[120px] rounded-xl resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl text-lg font-semibold"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analyzing Symptoms...
                        </>
                      ) : (
                        "Get Instant Assessment"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-dashed border-slate-300"
                >
                  <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <Bot className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Ready for Assessment</h3>
                  <p className="text-slate-500 max-w-xs">
                    Fill out the form to receive your AI-powered health analysis.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className={`border-none shadow-2xl rounded-3xl overflow-hidden ${result.riskFactor ? 'ring-2 ring-red-500' : 'ring-2 ring-emerald-500'}`}>
                    <div className={`p-4 text-center text-white font-bold ${result.riskFactor ? 'bg-red-500' : 'bg-emerald-500'}`}>
                      {result.riskFactor ? "HIGH RISK DETECTED" : "STABLE ASSESSMENT"}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardDescription className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-1">Potential Condition</CardDescription>
                          <CardTitle className="text-2xl font-bold text-slate-900">{result.predictedDisease}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-3 py-1">
                          {result.confidence}% Confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700">
                        "{result.analysis}"
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-1 rounded-full ${result.riskFactor ? 'bg-red-100' : 'bg-emerald-100'}`}>
                            {result.riskFactor ? (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">Recommended Action</h4>
                            <p className="text-slate-600">
                              {result.riskFactor 
                                ? "Please visit the nearest emergency department or contact a doctor immediately for a professional evaluation."
                                : "Your symptoms appear manageable, but monitor your condition and consult a healthcare professional if they persist or worsen."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1 rounded-full bg-blue-100">
                            <HeartPulse className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">Specialty Department</h4>
                            <p className="text-slate-600">
                              Recommended Department: <span className="font-semibold text-blue-700">{result.recommendedDepartment}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-xl border-slate-200"
                        onClick={() => {
                          setResult(null);
                          form.reset();
                        }}
                      >
                        New Assessment
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
