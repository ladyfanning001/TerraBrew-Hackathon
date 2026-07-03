import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CloudSun,
  Search,
  LogOut,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getFarmerCertifications, getPendingCertifications } from "@/lib/auth-server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const [weather, setWeather] = useState({ name: "Bandung", temp: 24, humidity: 78 });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigate = useNavigate();
  // Weather sync logic

  useEffect(() => {
    const handleWeatherUpdate = () => {
      const stored = localStorage.getItem("current_location");
      if (stored) {
        try {
          setWeather(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored weather", e);
        }
      }
    };

    window.addEventListener("weather-update", handleWeatherUpdate);
    handleWeatherUpdate(); // Initial load check

    return () => {
      window.removeEventListener("weather-update", handleWeatherUpdate);
    };
  }, []);

  // 1. Dynamic Notification Loading
  const { data: farmerCerts = [] } = useQuery({
    queryKey: ["certifications", user?.id],
    queryFn: () => getFarmerCertifications({ data: { farmerId: user?.id || 0 } }),
    enabled: !!user?.id && user?.role === "farmer",
  });

  const { data: validatorCerts = [] } = useQuery({
    queryKey: ["pendingCertifications", user?.id],
    queryFn: () => getPendingCertifications({ data: { validatorId: user?.id || 0 } }),
    enabled: !!user?.id && user?.role === "sea",
  });

  // Calculate notifications based on database state
  const getNotifications = () => {
    if (!user) return [];

    if (user.role === "farmer") {
      return (farmerCerts || []).map((c: any) => {
        let title = "";
        let description = "";
        let icon = <AlertCircle className="h-4 w-4 text-amber-500" />;
        let color = "text-amber-500 bg-amber-500/10";

        if (c.status === "approved") {
          title = "Certification Approved";
          description = `Your farm '${c.farm_name}' has been approved with an Ecoscore of ${Number(c.ecoscore).toFixed(2)}.`;
          icon = <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
          color = "text-emerald-500 bg-emerald-500/10";
        } else if (c.status === "rejected") {
          title = "Certification Rejected";
          description = `Your request for '${c.farm_name}' was rejected. Feedback: ${c.validator_feedback || "No details provided."}`;
          icon = <XCircle className="h-4 w-4 text-rose-500" />;
          color = "text-rose-500 bg-rose-500/10";
        } else {
          title = "Audit Request Pending";
          description = `Your request for '${c.farm_name}' is currently pending verification by regional SEA validator.`;
          icon = <AlertCircle className="h-4 w-4 text-amber-500" />;
          color = "text-amber-500 bg-amber-500/10";
        }

        return {
          id: `cert-${c.id}`,
          title,
          description,
          icon,
          color,
          time: new Date(c.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          status: c.status,
        };
      });
    } else {
      // Validator notifications
      return (validatorCerts || []).map((c: any) => {
        return {
          id: `val-${c.id}`,
          title: "New Review Request",
          description: `Farmer request from ${c.farmer_name || "farmer"} at '${c.farm_name}' is pending review.`,
          icon: <Inbox className="h-4 w-4 text-blue-500" />,
          color: "text-blue-500 bg-blue-500/10",
          time: new Date(c.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          status: "pending",
        };
      });
    }
  };

  const notifications = getNotifications();
  const unreadCount = notifications.length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.full_name || "Guest User";
  const displaySub =
    user?.role === "farmer"
      ? user.farm_name || "Petani Kopi"
      : user?.organization || "SEA Validator";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="text-foreground" />

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs">
          <CloudSun
            className="h-4 w-4 text-honey animate-bounce"
            style={{ animationDuration: "3s" }}
          />
          <span className="font-semibold text-foreground">
            {weather.name} · {weather.temp}°C
          </span>
          <span className="text-muted-foreground">Humidity {weather.humidity}%</span>
        </div>

        {/* 2. Beautiful Notification Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full hover:bg-secondary/40"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-destructive p-0 px-1 text-[10px] text-destructive-foreground border-none flex items-center justify-center font-bold">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 rounded-2xl border-border bg-card shadow-[var(--shadow-elegant)] overflow-hidden"
            align="end"
          >
            <div className="p-4 border-b border-border/40 bg-secondary/15 flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">Notifications</span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold text-forest bg-forest/10 border-transparent"
              >
                {unreadCount} Active
              </Badge>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-border/40">
              {notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3.5 hover:bg-secondary/10 transition-colors flex gap-3 text-left"
                  >
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.color}`}
                    >
                      {n.icon}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground leading-none">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        {n.description}
                      </p>
                      <span className="text-[9px] font-semibold text-muted-foreground/80 block mt-1">
                        {n.time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 px-4 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Inbox className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs font-bold">No notifications</p>
                  <p className="text-[10px] mt-0.5">Everything is up to date.</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* 3. General Profile Action Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-border bg-card hover:bg-secondary/15 px-1 py-1 pr-3 shadow-sm transition-all focus:outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-forest text-cream text-xs font-bold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col leading-tight text-left">
                <span className="text-xs font-bold text-foreground">{displayName}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {displaySub}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 p-1 rounded-2xl border-border bg-card shadow-[var(--shadow-elegant)]"
            align="end"
          >
            <DropdownMenuLabel className="p-3 text-left">
              <p className="text-xs font-bold text-foreground leading-none">{displayName}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate mt-1">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setIsProfileOpen(true)}
                className="p-2.5 text-xs font-semibold rounded-xl cursor-pointer hover:bg-secondary/20 flex items-center gap-2 text-foreground"
              >
                <User className="h-4 w-4 text-forest" />
                View Profile Details
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem
              onClick={logout}
              className="p-2.5 text-xs font-bold rounded-xl cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 4. Profile Details Dialog Modal */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="max-w-md rounded-3xl border-border bg-card shadow-[var(--shadow-elegant)] p-6">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
                <User className="h-5 w-5 text-forest" /> Account Profile
              </DialogTitle>
              <DialogDescription className="text-xs">
                Your registered credentials and regional assignment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-semibold">Full Name:</span>
                <span className="col-span-2 font-bold text-foreground">{user?.full_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-semibold">Email Address:</span>
                <span className="col-span-2 font-bold text-foreground">{user?.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-semibold">Account Role:</span>
                <span className="col-span-2 font-bold uppercase tracking-wider text-forest">
                  {user?.role === "sea" ? "SEA Validator" : "Farmer"}
                </span>
              </div>
              {user?.role === "farmer" ? (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground font-semibold">Farm Name:</span>
                  <span className="col-span-2 font-bold text-foreground">
                    {user?.farm_name || "N/A"}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground font-semibold">Organization:</span>
                  <span className="col-span-2 font-bold text-foreground">
                    {user?.organization || "N/A"}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-semibold">Assigned Region:</span>
                <span className="col-span-2 font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {user?.region || "N/A"}, {user?.country || "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-semibold">Joined Date:</span>
                <span className="col-span-2 font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setIsProfileOpen(false)}
                className="bg-forest text-cream hover:bg-forest-deep rounded-xl font-bold px-5"
              >
                Close Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
