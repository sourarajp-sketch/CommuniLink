/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Users, 
  Calendar as CalendarIcon, 
  Settings, 
  Bell, 
  Plus, 
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
  BarChart3,
  Archive,
  CalendarDays,
  ShieldCheck,
  Zap,
  Mail,
  UserPlus,
  Trash2,
  RefreshCcw,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format } from "date-fns";
import { Toaster } from "@/components/ui/sonner";
import { IssueForm, VolunteerProfileForm } from "@/src/components/Forms";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { auth, signInWithGoogle } from "@/src/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { FirestoreService } from "@/src/lib/FirestoreService";
import { toast } from "sonner";
import { summarizeNeeds, matchVolunteerToTask } from "@/src/services/aiService";

// Mock Data
const MOCK_ISSUES = [
  { id: "1", title: "Broken Water Pipe", location: "East Side", severity: "Critical", priority: "Urgent", status: "Open", category: "Infrastructure", time: "2h ago" },
  { id: "2", title: "Food Supply Shortage", location: "Community Center", severity: "High", priority: "High", status: "In Progress", category: "Welfare", time: "5h ago" },
  { id: "3", title: "Fallen Tree on Road", location: "Oak Street", severity: "Medium", priority: "Medium", status: "Open", category: "Safety", time: "1d ago" },
  { id: "4", title: "Senior Citizen Support", location: "Wellington Heights", severity: "Low", priority: "Low", status: "Resolved", category: "Elderly Care", time: "2d ago" },
];

const MOCK_VOLUNTEERS = [
  { id: "v1", name: "Alice Johnson", skills: ["Plumbing", "Heavy Lifting"], location: "East Side", status: "Available", tasks: 2 },
  { id: "v2", name: "Bob Smith", skills: ["Logistics", "Driving"], location: "Center", status: "Busy", tasks: 4 },
  { id: "v3", name: "Charlie Davis", skills: ["First Aid", "Translation"], location: "West Side", status: "Available", tasks: 0 },
];

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

const SEVERITY_DATA = [
  { name: "Critical", value: 12 },
  { name: "High", value: 19 },
  { name: "Medium", value: 32 },
  { name: "Low", value: 44 },
];

const IssueCard = ({ issue, volunteers, user, onAiMatch }: any) => {
  const assignedVolunteer = volunteers.find((v: any) => v.id === issue.assignedVolunteerId);

  return (
    <Card className="hover:shadow-md transition-all border-slate-200 group rounded-3xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={
            issue.severity === "Critical" ? "bg-rose-500" :
            issue.severity === "High" ? "bg-amber-500" :
            "bg-indigo-500 shadow-sm"
          }>
            {issue.severity}
          </Badge>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            issue.status === "Resolved" || issue.status === "Closed" ? "bg-emerald-100 text-emerald-600" :
            issue.status === "In Progress" ? "bg-amber-100 text-amber-600" :
            "bg-blue-100 text-blue-600"
          }`}>{issue.status || "Open"}</span>
        </div>
        <CardTitle className="text-lg mt-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{issue.title}</CardTitle>
        <CardDescription className="flex items-center gap-1 mt-1 font-medium italic text-xs">
          <MapPin size={12} /> {issue.location} · {issue.reportedBy === user?.uid ? "Your Report" : "Community"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed min-h-[40px]">{issue.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-slate-200">{issue.category || 'General'}</Badge>
          {assignedVolunteer && (
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-none">
              Assigned to: {assignedVolunteer.fullName}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex flex-col gap-3 items-stretch border-t border-slate-50 mt-2 p-6">
        <div className="flex justify-between gap-2 py-2">
          {issue.status !== "Resolved" ? (
            <Dialog>
              <DialogTrigger render={
                <Button variant="outline" size="sm" className="flex-1 text-xs font-bold text-indigo-600 border-indigo-100 hover:bg-indigo-50 rounded-xl">
                   <UserPlus size={14} className="mr-1.5" /> {issue.assignedVolunteerId ? "Reassign" : "Assign Volunteer"}
                </Button>
              } />
              <DialogContent className="rounded-3xl max-w-md">
                <div className="p-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Select Available Volunteer</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {volunteers
                      .filter(v => v.status === "Available" || v.id === issue.assignedVolunteerId)
                      .map(v => (
                      <div 
                        key={v.id} 
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                          issue.assignedVolunteerId === v.id ? "bg-indigo-50 border-indigo-200" : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                        onClick={async () => {
                          try {
                            await FirestoreService.assignVolunteer(issue.id, v.id);
                            toast.success(`Assigned to ${v.fullName}`);
                          } catch (e) {
                            toast.error("Assignment failed");
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-[10px] bg-slate-200">{v.fullName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{v.fullName}</p>
                            <div className="flex gap-1 mt-0.5">
                              {v.skills?.slice(0, 2).map((s: string) => (
                                <Badge key={s} className="text-[8px] py-0 px-1 bg-white border-slate-100 text-slate-500 uppercase">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        {v.id === issue.assignedVolunteerId && <CheckCircle2 size={16} className="text-indigo-600" />}
                      </div>
                    ))}
                    {volunteers.filter(v => v.status === "Available").length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-4 italic">No available volunteers. Volunteers can only do one job at a time.</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex-1 flex items-center justify-center text-emerald-600 bg-emerald-50 py-1.5 rounded-xl font-bold text-xs ring-1 ring-emerald-100">
              <CheckCircle2 size={16} className="mr-2" /> Mission Completed
            </div>
          )}
          
          {(issue.status === "In Progress" || issue.status === "Open" || !issue.status) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl"
              onClick={() => FirestoreService.markIssueResolved(issue.id, issue.assignedVolunteerId)}
            >
              Mark Completed
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100/50 flex items-center gap-2 rounded-xl py-4"
            onClick={() => onAiMatch(issue)}
          >
            <Zap size={14} /> AI Smart Recommendation
          </Button>
          {(user?.email === "sourarajp@gmail.com" || (issue.status === "Resolved" && issue.reportedBy === user?.uid)) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl"
              onClick={async (e) => {
                e.stopPropagation();
                if(confirm("Permanently delete this report from the database?")) {
                  try {
                    await FirestoreService.deleteIssue(issue.id);
                    toast.success("Issue deleted from database");
                  } catch (e: any) {
                    console.error("Delete failed:", e);
                    toast.error("Deletion failed. Check permissions.");
                  }
                }
              }}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const VolunteerCard = ({ volunteer, user }: any) => {
  const isSelf = volunteer.userId === user?.uid;
  
  return (
    <Card className="overflow-hidden border-slate-200 rounded-3xl hover:shadow-lg transition-all group">
      <CardHeader className="bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-indigo-50">
              <AvatarFallback className="bg-indigo-600 text-white font-bold">{volunteer.fullName?.split(' ').map((n: string)=>n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{volunteer.fullName}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-[10px] font-medium">
                <MapPin size={10} /> {volunteer.location}
              </CardDescription>
            </div>
          </div>
          <Badge className={
            volunteer.status === "Available" ? "bg-emerald-100 text-emerald-600 border-none px-2 py-0" :
            volunteer.status === "Busy" ? "bg-amber-100 text-amber-600 border-none px-2 py-0" :
            "bg-slate-100 text-slate-600 border-none px-2 py-0"
          }>
            {volunteer.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Skills & Expertise</p>
          <div className="flex flex-wrap gap-2">
            {volunteer.skills?.map((skill: string) => (
              <Badge key={skill} variant="secondary" className="bg-indigo-50 text-indigo-600 border-none text-[10px] py-0.5 px-2">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        
        {volunteer.availabilityDescription && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Availability</p>
            <p className="text-xs text-slate-600 font-medium italic line-clamp-1">{volunteer.availabilityDescription}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t border-slate-50 flex gap-2 p-4">
        <Dialog>
          <DialogTrigger render={
            <Button variant="ghost" size="sm" className="flex-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl">
              <Mail size={14} className="mr-2" /> Contact
            </Button>
          } />
          <DialogContent className="rounded-3xl max-w-sm">
             <div className="p-6 text-center">
               <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-4">
                 <Mail size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Contact Volunteer</h3>
               <p className="text-sm text-slate-500 mb-6">Reach out to coordination at:</p>
               <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-mono text-xs text-indigo-600 break-all">
                 {volunteer.email || "No direct email provided"}
               </div>
               <Button className="w-full mt-6 bg-indigo-600 rounded-xl" onClick={() => volunteer.email && (window.location.href = `mailto:${volunteer.email}`)}>Open Mail Client</Button>
             </div>
          </DialogContent>
        </Dialog>
        
        {isSelf && (
          <Dialog>
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="flex-1 text-xs font-bold text-slate-600 border-slate-200 rounded-xl">
                Edit Profile
              </Button>
            } />
            <DialogContent className="rounded-3xl max-w-lg">
              <VolunteerProfileForm 
                initialData={volunteer} 
                onSubmitSuccess={() => {}} 
              />
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
};

export default function App() {
  const [user, setUser] = useState<any>({ uid: 'guest_user', displayName: 'Admin Guest', email: 'sourarajp@gmail.com' });
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [issues, setIssues] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [issueSort, setIssueSort] = useState<"severity" | "date">("severity");
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [matchingIssue, setMatchingIssue] = useState<any | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Computed Stats
  const resolvedBySeverity = issues
    .filter(i => i.status === "Resolved")
    .reduce((acc: any, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, { "Critical": 0, "High": 0, "Medium": 0, "Low": 0 });

  const resolvedChartData = [
    { name: "Low", value: resolvedBySeverity["Low"], fill: "#22c55e" },
    { name: "Medium", value: resolvedBySeverity["Medium"], fill: "#eab308" },
    { name: "High", value: resolvedBySeverity["High"], fill: "#f97316" },
    { name: "Critical", value: resolvedBySeverity["Critical"], fill: "#ef4444" },
  ];

  const sortedIssues = [...issues].sort((a, b) => {
    if (issueSort === "severity") {
      const order = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
      return (order[a.severity as keyof typeof order] || 4) - (order[b.severity as keyof typeof order] || 4);
    }
    // Newest first for date
    return (b.reportedAt?.seconds || 0) - (a.reportedAt?.seconds || 0);
  });

  const activeIssues = issues.filter(i => i.status !== "Resolved" && i.status !== "Closed");
  const criticalCount = activeIssues.filter(i => i.severity === "Critical").length;
  const resolvedCount = issues.filter(i => i.status === "Resolved" || i.status === "Closed").length;

  const skillCounts = volunteers.reduce((acc: any, v) => {
    v.skills?.forEach((s: string) => {
      acc[s] = (acc[s] || 0) + 1;
    });
    return acc;
  }, {});
  const skillData = Object.entries(skillCounts).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value).slice(0, 5);

  const locationCounts = issues.reduce((acc: any, i) => {
    acc[i.location] = (acc[i.location] || 0) + 1;
    return acc;
  }, {});
  const locationData = Object.entries(locationCounts).map(([district, open]) => ({ 
    district, 
    open, 
    critical: issues.filter(issue => issue.location === district && issue.severity === "Critical").length 
  })).sort((a: any, b: any) => b.open - a.open);

  const categoryCounts = issues.reduce((acc: any, i) => {
    const cat = i.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts).map(([label, count]) => ({
    label,
    count: (count as number / (issues.length || 1) * 100).toFixed(0) + '%',
    val: count as number,
    color: label.includes('Medical') ? 'bg-rose-500' : label.includes('Supply') ? 'bg-emerald-500' : 'bg-indigo-500'
  }));

  useEffect(() => {
    const unsubIssues = FirestoreService.subscribeToIssues(setIssues);
    const unsubVolunteers = FirestoreService.subscribeToVolunteers(setVolunteers);

    return () => {
      unsubIssues();
      unsubVolunteers();
    };
  }, []);

  const handleAiSummary = async () => {
    if (issues.length === 0) {
      toast.info("No issues reported yet to summarize.");
      return;
    }
    toast.promise(summarizeNeeds(issues), {
      loading: "AI is analyzing community needs...",
      success: (data) => data,
      error: "Analysis failed."
    });
  };

  const handleUpdateStatus = async (issueId: string, newStatus: string) => {
    try {
      await FirestoreService.updateIssueStatus(issueId, newStatus);
      toast.success(`Issue marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleAiMatch = async (issue: any) => {
    setMatchingIssue(issue);
    toast.promise(matchVolunteerToTask(issue, volunteers), {
      loading: "AI is finding the best volunteer for this task...",
      success: (data) => {
        setAiRecommendations(data);
        setIsAiModalOpen(true);
        return `Found ${data.length} recommendations!`;
      },
      error: "AI analysis failed."
    });
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "issues", label: "Community Needs", icon: AlertCircle },
    { id: "volunteers", label: "Volunteers", icon: Users },
    { id: "calendar", label: "Schedule", icon: CalendarIcon },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-8 left-8 z-50">
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-xl shadow-lg bg-white border border-slate-200"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar - Adjusted for Bento Feel */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 260 : 80,
          x: isMobileMenuOpen || window.innerWidth > 768 ? 0 : -300
        }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className={`bg-white border-r border-slate-200 flex flex-col z-50 shadow-sm m-4 rounded-3xl fixed md:sticky top-4 bottom-4 left-0 h-[calc(100vh-32px)]`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg font-bold text-xl">
            C
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl text-slate-800 tracking-tight">CommuniLink</span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                activeTab === item.id 
                  ? "bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-100" 
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.label}</span>}
              {activeTab === item.id && !isSidebarOpen && (
                <div className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          {isSidebarOpen && (
            <div className="bg-slate-900 rounded-2xl p-4 text-white mb-4">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold">Public Access View</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100">
            <Avatar className="h-8 w-8 border border-white">
              <AvatarFallback>{user.displayName?.[0] || "G"}</AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || "Guest"}</p>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Community Access</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden py-4 px-4 md:pr-4 md:pl-0">
        {/* Header - Bento Style */}
        <header className="h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-between px-6 mb-4 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                className="pl-11 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 transition-all text-sm h-10" 
                placeholder="Search community reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 hidden sm:flex"
                onClick={() => setIssueSort(prev => prev === 'severity' ? 'date' : 'severity')}
              >
                <Filter size={14} className="mr-2" /> Sort: {issueSort}
              </Button>
              {user?.email === "sourarajp@gmail.com" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-rose-100 text-rose-500 hover:bg-rose-50 font-bold"
                  onClick={async () => {
                    if(confirm("DANGER: This will delete ALL reports and ALL volunteer profiles. Proceed?")) {
                      await FirestoreService.clearAllData();
                      toast.success("Database cleared");
                    }
                  }}
                >
                  <RefreshCcw size={14} className="mr-2" /> Reset
                </Button>
              )}
              <Dialog>
                <DialogTrigger render={
                  <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-10 px-6 font-bold text-sm shadow-lg shadow-indigo-100 flex gap-2">
                    <Plus size={18} /> <span className="hidden sm:inline">New Report</span>
                  </Button>
                } />
                <DialogContent className="sm:max-w-[500px] rounded-3xl">
                  <IssueForm onSubmitSuccess={() => {}} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-4 grid-rows-3 gap-4 h-full min-h-[700px]"
              >
                {/* Main Hero Card - Bento Style */}
                <Card className="col-span-2 row-span-1 bg-white border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                      <LayoutDashboard size={24} />
                    </div>
                  </div>
                  <div>
                    <Badge className="bg-emerald-100 text-emerald-600 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-3">Live Insights</Badge>
                    <h1 className="text-3xl font-bold text-slate-800 leading-tight">Community <br/>Impact Overview</h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-xs font-medium">Monitoring real-time community survey data and field reports for rapid coordination.</p>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs" onClick={handleAiSummary}>AI Summary</Button>
                    <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-indigo-600">Export Report</Button>
                  </div>
                </Card>

                {/* Impact Stat - Indigo */}
                <Card className="col-span-1 row-span-1 bg-indigo-600 border-none rounded-3xl p-6 shadow-xl shadow-indigo-100 flex flex-col justify-between text-white group">
                   <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Active Issues</p>
                   <div>
                     <h3 className="text-5xl font-bold group-hover:translate-x-1 transition-transform">{issues.filter(i => i.status !== 'Resolved').length}</h3>
                     <p className="text-indigo-200 text-xs mt-1 font-medium italic">Pending field attention</p>
                   </div>
                   <div className="bg-indigo-500/30 h-1.5 w-full rounded-full overflow-hidden">
                     <div className="bg-white h-full rounded-full" style={{width: '65%'}}></div>
                   </div>
                </Card>

                {/* Volunteers Stat - Emerald */}
                <Card className="col-span-1 row-span-1 bg-emerald-600 border-none rounded-3xl p-6 shadow-xl shadow-emerald-100 flex flex-col justify-between text-white group">
                  <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Global Reach</p>
                  <div>
                    <h3 className="text-5xl font-bold group-hover:translate-x-1 transition-transform">{volunteers.length}</h3>
                    <p className="text-emerald-200 text-xs mt-1 font-medium">Verified local volunteers</p>
                  </div>
                  <Users className="absolute bottom-6 right-6 text-emerald-500/50" size={48} />
                </Card>

                {/* Map/Heatmap Area */}
                <Card className="col-span-2 row-span-2 bg-slate-900 border-none rounded-3xl p-8 relative overflow-hidden shadow-2xl group">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
                  <div className="relative z-10">
                    <h3 className="text-white font-bold text-xl mb-1">Needs Density Analysis</h3>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Strategic Hotspots</p>
                    
                    <div className="mt-12 space-y-6">
                      {categoryData.length > 0 ? categoryData.slice(0, 3).map((h, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                             <span>{h.label}</span>
                             <span>{h.count}</span>
                           </div>
                           <div className="h-1 bg-slate-800 rounded-full w-full">
                             <div className={`h-full rounded-full ${h.color}`} style={{width: h.count}}></div>
                           </div>
                        </div>
                      )) : (
                        <div className="text-slate-500 italic text-xs">No categorical data available yet.</div>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-white uppercase mb-2">Urgent Reports</p>
                    <div className="flex -space-x-2">
                      {issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length > 0 ? 
                        issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').slice(0, 5).map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-rose-500 border-2 border-slate-900 animate-pulse"></div>
                        )) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
                        )
                      }
                    </div>
                  </div>
                </Card>

                {/* Chart Bento Box */}
                <Card className="col-span-2 row-span-1 bg-white border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Issues Resolved till Date</h4>
                    <CheckCircle2 className="text-emerald-500" size={16} />
                  </div>
                  <div className="flex-1 min-h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resolvedChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 600, fill: '#64748b'}}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 600, fill: '#64748b'}}
                        />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                          {resolvedChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Recent Items / Tasks Grid */}
                <Card className="col-span-2 row-span-1 bg-white border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Priority Pipeline</h4>
                    <span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">View All Needs</span>
                  </div>
                  <div className="space-y-3">
                    {issues.slice(0, 2).map((issue) => (
                      <div key={issue.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${issue.severity === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {issue.title[0]}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800">{issue.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1"><MapPin size={8} /> {issue.location}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-xl text-[10px] font-bold h-7 px-3 bg-white" onClick={() => handleAiMatch(issue)}>AI Match</Button>
                      </div>
                    ))}
                    {issues.length === 0 && <div className="h-full flex items-center justify-center italic text-slate-400 text-xs">Awaiting field reports...</div>}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "issues" && (
                <motion.div 
                  key="issues"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Community Needs</h2>
                      <p className="text-slate-500">Track and respond to urgent local reports.</p>
                    </div>
                    <Dialog>
                      <DialogTrigger render={
                        <Button className="bg-indigo-600 hover:bg-indigo-700">Report New Issue</Button>
                      } />
                      <DialogContent className="sm:max-w-[500px]">
                        <IssueForm onSubmitSuccess={() => {}} />
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="flex gap-4 mb-6">
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="bg-white border text-slate-500">
                        <TabsTrigger value="all">All Issues</TabsTrigger>
                        <TabsTrigger value="open">Open</TabsTrigger>
                        <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved</TabsTrigger>
                      </TabsList>
                      <TabsContent value="all" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {sortedIssues.map(issue => (
                            <IssueCard key={issue.id} issue={issue} volunteers={volunteers} user={user} onAiMatch={handleAiMatch} />
                          ))}
                          {issues.length === 0 && <p className="col-span-full text-center text-slate-400 py-20 italic">No community needs reported yet.</p>}
                        </div>
                      </TabsContent>
                      <TabsContent value="open" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {sortedIssues.filter(i => i.status === "Open" || !i.status).map(issue => (
                            <IssueCard key={issue.id} issue={issue} volunteers={volunteers} user={user} onAiMatch={handleAiMatch} />
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="in-progress" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {sortedIssues.filter(i => i.status === "In Progress").map(issue => (
                            <IssueCard key={issue.id} issue={issue} volunteers={volunteers} user={user} onAiMatch={handleAiMatch} />
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="resolved" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {sortedIssues.filter(i => i.status === "Resolved").map(issue => (
                            <IssueCard key={issue.id} issue={issue} volunteers={volunteers} user={user} onAiMatch={handleAiMatch} />
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </motion.div>
            )}

            {activeTab === "volunteers" && (
                <motion.div 
                  key="volunteers"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Volunteer Network</h2>
                      <p className="text-slate-500">Manage community helpers and their assignments.</p>
                    </div>
                    <Dialog>
                      <DialogTrigger render={
                        <Button className="bg-indigo-600">Register Volunteer</Button>
                      } />
                      <DialogContent>
                        <VolunteerProfileForm onSubmitSuccess={() => {}} />
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {volunteers.map(volunteer => (
                      <VolunteerCard key={volunteer.id} volunteer={volunteer} user={user} />
                    ))}
                    {volunteers.length === 0 && <p className="col-span-full text-center text-slate-400 py-20 italic">No community helpers registered yet.</p>}
                  </div>
                </motion.div>
            )}

            {activeTab === "analytics" && (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Resource & Impact Analytics</h2>
                    <p className="text-slate-500">In-depth tracking of community support and volunteer efficiency.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Issues Resolved over Time</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { month: 'Jan', count: 12 },
                            { month: 'Feb', count: 18 },
                            { month: 'Mar', count: 15 },
                            { month: 'Apr', count: 28 },
                            { month: 'May', count: 32 },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Volunteer Skill Diversity</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px] flex items-center justify-center">
                        {skillData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={skillData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {skillData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-slate-400 italic text-sm">Waiting for volunteer registration...</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Open Needs by District</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {locationData.length > 0 ? locationData.map((d, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-24 text-sm font-semibold text-slate-700">{d.district}</div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(((d.open as number) / (issues.length || 1)) * 100, 100)}%` }} />
                            </div>
                            <div className="w-12 text-xs font-bold text-slate-500">{d.open} open</div>
                            <div className="w-16">
                               {d.critical > 0 && <Badge className="bg-red-50 text-red-600 border-red-100">{d.critical} critical</Badge>}
                            </div>
                          </div>
                        )) : (
                          <div className="text-slate-400 italic text-sm py-4">No reported locations yet.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
            )}

            {activeTab === "calendar" && (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <Card className="lg:col-span-2 border-none shadow-sm h-fit">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                       <CalendarDays className="text-indigo-600" /> Community Events & Deadlines
                    </CardTitle>
                    <CardDescription>Track upcoming support drives, health camps, and report resolutions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-3xl border border-slate-100 p-4 mx-auto"
                      />
                    <div className="mt-8 space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-4">
                           <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest px-2 flex items-center gap-2">
                             <Clock size={12} className="text-rose-500" /> Today's Needs / Emergencies
                           </h4>
                           {issues.filter(i => {
                              const issueDate = i.reportedAt?.seconds ? new Date(i.reportedAt.seconds * 1000) : new Date();
                              const selectedDate = date || new Date();
                              return issueDate.toDateString() === selectedDate.toDateString() && i.status !== 'Resolved';
                           }).map(i => (
                             <div key={i.id} className="p-4 bg-rose-50/50 border-l-4 border-rose-500 rounded-r-2xl flex justify-between items-center group cursor-pointer hover:bg-rose-50 transition-colors" onClick={() => setActiveTab('issues')}>
                               <div>
                                 <p className="text-sm font-bold text-slate-900 line-clamp-1">{i.title}</p>
                                 <p className="text-[10px] text-rose-600 font-bold uppercase">{i.severity} Severity</p>
                               </div>
                               <Badge className="bg-white text-rose-600 border-none shadow-sm">{i.status || 'Open'}</Badge>
                             </div>
                           ))}
                           {issues.filter(i => {
                              const issueDate = i.reportedAt?.seconds ? new Date(i.reportedAt.seconds * 1000) : new Date();
                              const selectedDate = date || new Date();
                              return issueDate.toDateString() === selectedDate.toDateString() && i.status !== 'Resolved';
                           }).length === 0 && <p className="text-xs text-slate-400 italic px-2">No active reports for this day.</p>}
                         </div>

                         <div className="space-y-4">
                           <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest px-2 flex items-center gap-2">
                             <CheckCircle2 size={12} className="text-emerald-500" /> Completed Resolutions
                           </h4>
                           {issues.filter(i => {
                              const issueDate = i.reportedAt?.seconds ? new Date(i.reportedAt.seconds * 1000) : new Date();
                              const selectedDate = date || new Date();
                              return issueDate.toDateString() === selectedDate.toDateString() && i.status === 'Resolved';
                           }).map(i => (
                             <div key={i.id} className="p-4 bg-emerald-50/50 border-l-4 border-emerald-500 rounded-r-2xl flex justify-between items-center group cursor-pointer hover:bg-emerald-50 transition-colors" onClick={() => setActiveTab('issues')}>
                               <div>
                                 <p className="text-sm font-bold text-slate-900 line-clamp-1">{i.title}</p>
                                 <p className="text-[10px] text-emerald-600 font-bold uppercase">Resolved</p>
                               </div>
                               <CheckCircle2 size={16} className="text-emerald-500" />
                             </div>
                           ))}
                           {issues.filter(i => {
                              const issueDate = i.reportedAt?.seconds ? new Date(i.reportedAt.seconds * 1000) : new Date();
                              const selectedDate = date || new Date();
                              return issueDate.toDateString() === selectedDate.toDateString() && i.status === 'Resolved';
                           }).length === 0 && <p className="text-xs text-slate-400 italic px-2">No items resolved on this date.</p>}
                         </div>
                       </div>

                       <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest px-2 flex items-center gap-2">
                            <Plus size={12} className="text-indigo-500" /> Upcoming Needs
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {issues.filter(i => {
                               const issueDate = i.reportedAt?.seconds ? new Date(i.reportedAt.seconds * 1000) : new Date();
                               const selectedDate = date || new Date();
                               return issueDate > selectedDate && i.status !== 'Resolved';
                            }).slice(0, 4).map(i => (
                              <div key={i.id} className="p-3 bg-indigo-50 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                                    {i.title[0]}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{i.title}</p>
                                    <p className="text-[9px] text-slate-500 font-medium">Scheduled for future action</p>
                                  </div>
                                </div>
                                <ChevronRight size={14} className="text-indigo-300 group-hover:text-indigo-600 transition-colors" />
                              </div>
                            ))}
                          </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-6">
                  <Card className="bg-slate-900 text-white border-none rounded-3xl p-6 shadow-xl">
                    <h4 className="font-bold text-lg mb-4">Quick Stats</h4>
                    <div className="space-y-4 font-medium">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Drive Participation</span>
                        <span className="text-indigo-400">82%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Weekly Growth</span>
                        <span className="text-emerald-400">+12%</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="border-none shadow-sm rounded-3xl p-4">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl text-amber-900 border border-amber-100">
                      <AlertCircle size={20} />
                      <div>
                        <p className="text-xs font-bold">Upcoming: Health Camp Setup</p>
                        <p className="text-[10px] opacity-80">Volunteers needed at Downtown Hub tomorrow.</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex items-center gap-6">
                   <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-2 ring-indigo-50">
                     <AvatarImage src={user.photoURL || ""} />
                     <AvatarFallback className="text-3xl font-bold bg-indigo-600 text-white">{user.displayName?.[0]}</AvatarFallback>
                   </Avatar>
                   <div>
                     <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{user.displayName}</h2>
                     <p className="text-slate-500 font-medium">{user.email}</p>
                     <div className="mt-2 flex gap-2">
                        <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold">Verified User</Badge>
                        <Badge variant="outline" className="text-slate-400 border-slate-200 font-bold uppercase text-[10px]">Community Member</Badge>
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm rounded-3xl p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                       <ShieldCheck size={24} />
                    </div>
                    <CardTitle className="text-lg mb-2">Security & Identity</CardTitle>
                    <CardDescription>Manage your authentication methods and data privacy settings.</CardDescription>
                  </Card>

                  <Card className="border-none shadow-sm rounded-3xl p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
                       <Bell size={24} />
                    </div>
                    <CardTitle className="text-lg mb-2">Notification Center</CardTitle>
                    <CardDescription>Configure alerts for nearby urgent reports and mission updates.</CardDescription>
                  </Card>
                </div>

                <Card className="border-none shadow-sm rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Application Preferences</h3>
                  <div className="space-y-6">
                    {[
                      {label: 'Privacy Mode', desc: 'Anonymize your reports in public feeds'},
                      {label: 'Auto-Sync', desc: 'Sync data in real-time across devices'},
                      {label: 'AI Assistance', desc: 'Enable AI-powered recommendations and summaries'}
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="font-bold text-slate-800">{pref.label}</p>
                          <p className="text-xs text-slate-500 font-medium">{pref.desc}</p>
                        </div>
                        <div className="w-10 h-6 bg-emerald-100 rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm translate-x-4 transition-transform"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-indigo-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Zap className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">AI Smart Match</h2>
            </div>
            <p className="text-indigo-100 font-medium text-sm">We've identified the best available volunteers for this mission based on their skillset and location.</p>
          </div>
          
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {aiRecommendations.length > 0 ? (
              aiRecommendations.map((rec, idx) => (
                <div key={rec.id} className="group relative bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">{rec.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] py-0 px-1.5 font-bold">
                            {rec.score}% Match
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-3 h-8 text-xs"
                      onClick={() => {
                        FirestoreService.assignVolunteer(matchingIssue.id, rec.id);
                        setIsAiModalOpen(false);
                        toast.success(`Assigned to ${rec.name}!`);
                      }}
                    >
                      Assign
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed ml-11 italic">
                    "{rec.reason}"
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Users className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-medium text-sm">No suitable candidates found for this specific task.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 flex justify-end">
            <Button variant="ghost" className="rounded-xl font-bold text-slate-500 text-xs" onClick={() => setIsAiModalOpen(false)}>
              Close Recommendations
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
