"use client";

import {
  ArrowUpRightIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  HandshakeIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CrmView } from "@/lib/crm/nav";

export function CrmView({ view }: { readonly view: CrmView }) {
  switch (view) {
    case "dashboard":
      return <DashboardView />;
    case "contacts":
      return <ContactsView />;
    case "deals":
      return <DealsView />;
    case "settings":
      return <SettingsView />;
    default:
      return null;
  }
}

function DashboardView() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6 lg:px-10">
      <PageHeader
        description="Pulse of your sales pipeline at a glance."
        title="Dashboard"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={HandshakeIcon}
          label="Open deals"
          trend="+3 this week"
          value="$48,200"
        />
        <StatCard
          icon={UsersIcon}
          label="Contacts"
          trend="+18 this month"
          value="1,284"
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Win rate"
          trend="+4.2% MoM"
          value="32.4%"
        />
        <StatCard
          icon={MailIcon}
          label="Replies"
          trend="Last 7 days"
          value="96"
        />
      </div>
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Pipeline velocity</CardTitle>
            <CardDescription>Deals moved per week, last 6 weeks.</CardDescription>
          </div>
          <Badge variant="secondary">+12%</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-3">
            {[40, 65, 52, 80, 70, 96].map((h, i) => (
              <div
                className="flex flex-1 flex-col items-center gap-2"
                key={i}
              >
                <div
                  className="w-full rounded-md bg-foreground/85"
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  W{i + 1}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactsView() {
  const rows = MOCK_CONTACTS;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6 lg:px-10">
      <PageHeader
        description="Manage the people in your workspace."
        title="Contacts"
      />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <BuildingIcon className="size-3.5" />
                    {row.company}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.email}</TableCell>
                <TableCell className="text-muted-foreground">{row.phone}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {row.owner}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function DealsView() {
  const stages = [
    { stage: "Lead", color: "bg-muted" },
    { stage: "Qualified", color: "bg-foreground/30" },
    { stage: "Proposal", color: "bg-foreground/55" },
    { stage: "Negotiation", color: "bg-foreground/80" },
    { stage: "Closed", color: "bg-foreground" },
  ];

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6 lg:px-10">
      <PageHeader
        description="Track opportunities from first contact to close."
        title="Deals"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stages.map((stage, index) => {
          const count = 6 - index;
          const value = (count * 8200).toLocaleString();
          return (
            <Card key={stage.stage} className="gap-3">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">{stage.stage}</CardTitle>
                <span className={`size-2.5 rounded-full ${stage.color}`} />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xl font-semibold">${value}</p>
                <p className="text-xs text-muted-foreground">{count} deals</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active opportunities</CardTitle>
          <CardDescription>Sorted by expected close date.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {MOCK_DEALS.map((deal) => (
              <li
                className="flex items-center justify-between gap-3 py-3"
                key={deal.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{deal.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {deal.company} · closes {deal.closeDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">${deal.value}</span>
                  <Badge variant="outline">{deal.stage}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6 lg:px-10">
      <PageHeader
        description="Workspace preferences and integrations."
        title="Settings"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Basics shown to your team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Name" value="HotWater24" />
            <Row label="Plan" value="Growth" />
            <Row label="Region" value="us-east-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agent</CardTitle>
            <CardDescription>Configure the eve copilot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Model" value="eve - glm-5.2" />
            <Row label="Connection" value="Linear · Notion · Sentry" />
            <Button size="sm" variant="outline">
              Manage agent
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PageHeader({ title, description }: { readonly title: string; readonly description: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button className="gap-1.5" size="sm" variant="outline">
        <ArrowUpRightIcon className="size-4" />
        Export
      </Button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  trend,
  value,
}: {
  readonly icon: typeof HandshakeIcon;
  readonly label: string;
  readonly trend: string;
  readonly value: string;
}) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex-row items-center justify-between">
        <CardDescription>{label}</CardDescription>
        <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { readonly status: string }) {
  const variant =
    status === "Customer"
      ? "default"
      : status === "Lead"
        ? "secondary"
        : "outline";
  return <Badge variant={variant as "default" | "secondary" | "outline"}>{status}</Badge>;
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

type ContactRow = {
  readonly id: string;
  readonly name: string;
  readonly company: string;
  readonly email: string;
  readonly phone: string;
  readonly status: string;
  readonly owner: string;
};

const MOCK_CONTACTS: ContactRow[] = [
  {
    id: "1",
    name: "Avery Quinn",
    company: "Northwind Labs",
    email: "avery@northwind.io",
    phone: "+1 415 555 0132",
    status: "Customer",
    owner: "You",
  },
  {
    id: "2",
    name: "Mateo Alvarez",
    company: "Brightline",
    email: "mateo@brightline.co",
    phone: "+1 212 555 0190",
    status: "Lead",
    owner: "Priya",
  },
  {
    id: "3",
    name: "Sofia Nakamura",
    company: "Atlas Robotics",
    email: "sofia@atlasrobotics.com",
    phone: "+1 650 555 0148",
    status: "Working",
    owner: "You",
  },
  {
    id: "4",
    name: "Liam O'Connor",
    company: "Cedar & Co.",
    email: "liam@cedarco.com",
    phone: "+1 305 555 0166",
    status: "Customer",
    owner: "Devon",
  },
  {
    id: "5",
    name: "Maya Patel",
    company: "Helios Energy",
    email: "maya@helios.energy",
    phone: "+1 646 555 0177",
    status: "Lead",
    owner: "You",
  },
];

type DealRow = {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly value: string;
  readonly stage: string;
  readonly closeDate: string;
};

const MOCK_DEALS: DealRow[] = [
  {
    id: "1",
    title: "Annual platform license",
    company: "Northwind Labs",
    value: "24,000",
    stage: "Negotiation",
    closeDate: "Aug 12",
  },
  {
    id: "2",
    title: "Pilot rollout · 50 seats",
    company: "Atlas Robotics",
    value: "11,500",
    stage: "Proposal",
    closeDate: "Aug 03",
  },
  {
    id: "3",
    title: "Upgrade to Growth plan",
    company: "Cedar & Co.",
    value: "6,800",
    stage: "Closed",
    closeDate: "Jul 22",
  },
  {
    id: "4",
    title: "Discovery call · Q3",
    company: "Helios Energy",
    value: "4,000",
    stage: "Qualified",
    closeDate: "Aug 28",
  },
];