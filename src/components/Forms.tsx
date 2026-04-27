import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FirestoreService } from "@/src/lib/FirestoreService";

export function IssueForm({ onSubmitSuccess }: { onSubmitSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "Medium",
    priority: "Medium",
    location: "",
    category: "General"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await FirestoreService.reportIssue(formData);
      toast.success("Community issue reported successfully!");
      onSubmitSuccess();
    } catch (error) {
      toast.error("Failed to report issue. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle>Report a Community Need</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Broken streetlight" 
              required 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select 
                value={formData.severity} 
                onValueChange={(v) => setFormData({...formData, severity: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData({...formData, priority: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              placeholder="e.g. North Square Park" 
              required 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Need Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(v) => setFormData({...formData, category: v})}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                <SelectItem value="Food Supply">Food Supply</SelectItem>
                <SelectItem value="Water Supply">Water Supply</SelectItem>
                <SelectItem value="Shelter / Housing">Shelter / Housing</SelectItem>
                <SelectItem value="Rescue / Evacuation">Rescue / Evacuation</SelectItem>
                <SelectItem value="Sanitation / Hygiene">Sanitation / Hygiene</SelectItem>
                <SelectItem value="Clothing / Essentials">Clothing / Essentials</SelectItem>
                <SelectItem value="Electricity / Power">Electricity / Power</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description</Label>
            <textarea 
              id="description" 
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Provide more details about the situation..."
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function VolunteerProfileForm({ onSubmitSuccess, initialData }: { onSubmitSuccess: () => void, initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      fullName: initialData?.fullName || "",
      skills: initialData?.skills?.join(", ") || "",
      availability: initialData?.availability || "",
      availabilityDescription: initialData?.availabilityDescription || "",
      location: initialData?.location || "",
      status: initialData?.status || "Available",
      email: initialData?.email || ""
    });
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await FirestoreService.saveVolunteerProfile({
          ...formData,
          skills: formData.skills.split(",").map(s => s.trim()).filter(s => s !== "")
        });
        toast.success("Volunteer profile updated!");
        onSubmitSuccess();
      } catch (error) {
        toast.error("Failed to save profile.");
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <Card className="border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-xl font-bold">{initialData ? "Edit Volunteer Profile" : "Register Volunteer Network"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  placeholder="John Doe" 
                  required 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vemail">Contact Email</Label>
                <Input 
                  id="vemail" 
                  type="email"
                  placeholder="john@example.com" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Input 
                id="skills" 
                placeholder="e.g. Plumbing, Medical, Teaching" 
                required 
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                className="rounded-xl"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vlocation">Primary Location</Label>
                <Input 
                  id="vlocation" 
                  placeholder="e.g. West District" 
                  required 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vstatus">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vdesc">Availability Description</Label>
              <textarea 
                id="vdesc" 
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. Can help on weekends and after 6 PM weekdays..."
                value={formData.availabilityDescription}
                onChange={(e) => setFormData({...formData, availabilityDescription: e.target.value})}
              />
            </div>
  
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11 font-bold" disabled={loading}>
              {loading ? "Saving..." : "Save Volunteer Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
