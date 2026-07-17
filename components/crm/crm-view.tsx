"use client";

import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircle2Icon,
  HandshakeIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TrendingUpIcon,
  UsersIcon,
  QuoteIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useMemo } from "react";

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
import {
  formatQuoteLocation,
  formatQuoteName,
  type QuoteListItem,
  type QuoteRow,
} from "@/lib/crm/quotes";
import { cn } from "@/lib/utils";

export function CrmView({ view }: { readonly view: CrmView }) {
  switch (view) {
    case "dashboard":
      return <DashboardView />;
    case "quotes":
      return <QuotesView />;
    case "deals":
      return <DealsView />;
    case "settings":
      return <SettingsView />;
    default:
      return null;
  }
}

function DashboardView() {
  const [list, setList] = useState<QuoteListState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    setList({ status: "loading" });

    void (async () => {
      try {
        const res = await fetch("/api/crm/quotes?limit=500");
        const result = await res.json();

        if (cancelled) {
          return;
        }

        if (result.ok) {
          setList({ status: "ready", quotes: result.quotes });
        } else {
          setList({ status: "error", message: result.error });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setList({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to load quotes.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (list.status !== "ready") {
      return {
        totalLast5Days: 0,
        contactedLast5Days: 0,
        contactRate: 0,
        avgGeyserSize: 0,
        daysData: [],
      };
    }

    const quotes = list.quotes;
    
    // Generate dates for the last 5 days (today is index 4)
    const last5Days: Date[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last5Days.push(d);
    }

    let totalLast5Days = 0;
    let contactedLast5Days = 0;
    let geyserSizesCount = 0;
    let geyserSizesSum = 0;

    const daysData = last5Days.map((day) => {
      const dayQuotes = quotes.filter((q) => {
        if (!q.created_at) return false;
        return day.toDateString() === new Date(q.created_at).toDateString();
      });

      const total = dayQuotes.length;
      const contacted = dayQuotes.filter((q) => q.contacted).length;
      const newQuotes = total - contacted;

      totalLast5Days += total;
      contactedLast5Days += contacted;

      dayQuotes.forEach((q) => {
        if (q.geyserSize) {
          geyserSizesSum += q.geyserSize;
          geyserSizesCount++;
        }
      });

      const dayFormatter = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      return {
        date: day,
        label: dayFormatter.format(day),
        total,
        contacted,
        newQuotes,
      };
    });

    const maxTotal = Math.max(...daysData.map((d) => d.total), 1);
    
    const daysDataWithHeights = daysData.map((d) => ({
      ...d,
      height: (d.total / maxTotal) * 100,
      contactedHeight: d.total > 0 ? (d.contacted / d.total) * 100 : 0,
    }));

    const contactRate = totalLast5Days > 0 ? Math.round((contactedLast5Days / totalLast5Days) * 100) : 0;
    const avgGeyserSize = geyserSizesCount > 0 ? Math.round(geyserSizesSum / geyserSizesCount) : 0;

    return {
      totalLast5Days,
      contactedLast5Days,
      contactRate,
      avgGeyserSize,
      daysData: daysDataWithHeights,
    };
  }, [list]);

  if (list.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  if (list.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-destructive">{list.message}</p>
        <Button onClick={() => window.location.reload()} size="sm" variant="outline">
          Reload page
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6 lg:px-10">
      <PageHeader
        description="Performance indicators and quote submission trends."
        title="Dashboard"
      />
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={QuoteIcon}
          label="Total quotes (5d)"
          trend={`All time: ${list.quotes.length}`}
          value={String(stats.totalLast5Days)}
        />
        <StatCard
          icon={CheckCircle2Icon}
          label="Contacted (5d)"
          trend={`${stats.totalLast5Days - stats.contactedLast5Days} pending`}
          value={`${stats.contactedLast5Days} / ${stats.totalLast5Days}`}
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Contact rate"
          trend="Target: 90%+"
          value={`${stats.contactRate}%`}
        />
        <StatCard
          icon={CalendarIcon}
          label="Avg geyser size"
          trend="Based on last 5d"
          value={stats.avgGeyserSize > 0 ? `${stats.avgGeyserSize} L` : "—"}
        />
      </div>

      {/* Quote Activity Chart */}
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Quotes activity</CardTitle>
            <CardDescription>Submitted and contacted quote requests over the last 5 days.</CardDescription>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30" variant="outline">
            Last 5 Days
          </Badge>
        </CardHeader>
        <CardContent>
          {stats.totalLast5Days === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No quotes submitted in the last 5 days.
            </div>
          ) : (
            <div className="flex h-64 items-end gap-4 md:gap-8 pt-8">
              {stats.daysData.map((d, i) => (
                <div
                  className="group relative flex flex-1 flex-col items-center gap-2 h-full justify-end"
                  key={i}
                >
                  {/* Premium floating tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-md bg-popover px-3 py-1.5 text-xs font-semibold text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-border z-20">
                    <p className="font-bold text-foreground mb-0.5">{d.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Total: <span className="text-foreground">{d.total}</span> · Contacted: <span className="text-foreground">{d.contacted}</span>
                    </p>
                  </div>

                  {/* The Chart Bar (Total Quotes) */}
                  <div
                    className="relative w-full rounded-t-md bg-muted overflow-hidden transition-all duration-300 hover:bg-muted/80 flex flex-col justify-end min-h-[8px]"
                    style={{ height: `${Math.max(d.height, 4)}%` }}
                  >
                    {/* Contacted sub-bar */}
                    {d.total > 0 && d.contacted > 0 && (
                      <div
                        className="w-full rounded-t-sm bg-primary transition-all duration-500"
                        style={{ height: `${d.contactedHeight}%` }}
                      />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className="text-xs text-muted-foreground font-medium text-center truncate w-full">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type QuoteListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; quotes: QuoteListItem[] };

type QuoteDetailState =
  | { status: "loading"; id: number }
  | { status: "error"; id: number; message: string }
  | { status: "ready"; quote: QuoteRow };

function useQuoteIdFromPath() {
  const pathname = usePathname();
  const match = pathname.match(/^\/quotes\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function QuotesView() {
  const pathname = usePathname();
  const quoteId = useQuoteIdFromPath();
  const [list, setList] = useState<QuoteListState>({ status: "loading" });
  const [detail, setDetail] = useState<QuoteDetailState | null>(null);

  useEffect(() => {
    let cancelled = false;

    setList({ status: "loading" });

    void (async () => {
      try {
        const res = await fetch("/api/crm/quotes?limit=200");
        const result = await res.json();

        if (cancelled) {
          return;
        }

        if (result.ok) {
          setList({ status: "ready", quotes: result.quotes });
        } else {
          setList({ status: "error", message: result.error });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setList({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to load quotes.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (quoteId === null) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetail({ status: "loading", id: quoteId });

    void (async () => {
      try {
        const res = await fetch(`/api/crm/quotes/${quoteId}`);
        const result = await res.json();

        if (cancelled) {
          return;
        }

        if (res.status === 404) {
          setDetail({
            status: "error",
            id: quoteId,
            message: `Quote ${quoteId} not found.`,
          });
          return;
        }

        if (result.ok) {
          setDetail({ status: "ready", quote: result.quote });
        } else {
          setDetail({
            status: "error",
            id: quoteId,
            message: result.error,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setDetail({
          status: "error",
          id: quoteId,
          message: error instanceof Error ? error.message : "Failed to load quote.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const handleRetry = useCallback(() => {
    if (quoteId !== null) {
      const qid = quoteId;
      setDetail({ status: "loading", id: qid });

      void (async () => {
        try {
          const res = await fetch(`/api/crm/quotes/${qid}`);
          const result = await res.json();

          if (res.status === 404) {
            setDetail({
              status: "error",
              id: qid,
              message: `Quote ${qid} not found.`,
            });
            return;
          }

          if (result.ok) {
            setDetail({ status: "ready", quote: result.quote });
          } else {
            setDetail({
              status: "error",
              id: qid,
              message: result.error,
            });
          }
        } catch (error) {
          setDetail({
            status: "error",
            id: qid,
            message: error instanceof Error ? error.message : "Failed to load quote.",
          });
        }
      })();
    }
  }, [quoteId]);

  if (quoteId !== null) {
    return (
      <QuoteDetailView
        state={detail ?? { status: "loading", id: quoteId }}
        onBack={handleBack}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6 lg:px-10">
      <PageHeader
        description="Quote requests submitted through Hotwater24."
        title="Quotes"
      />
      <Card className="py-0">
        {list.status === "loading" ? (
          <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Loading quotes...
          </div>
        ) : list.status === "error" ? (
          <div className="px-6 py-10 text-sm text-destructive">
            {list.message}
          </div>
        ) : list.quotes.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            No quotes yet. New quote requests will appear here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Geyser</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.quotes.map((quote) => (
                <TableRow className="cursor-pointer" key={quote.id}>
                  <Link
                    className="contents"
                    href={`/quotes/${quote.id}`}
                    prefetch={true}
                  >
                    <TableCell className="text-muted-foreground">
                      {quote.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatQuoteName(quote)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatQuoteLocation(quote)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quote.geyserSize ? `${quote.geyserSize}L` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(quote.created_at)}
                    </TableCell>
                    <TableCell>
                      <ContactedBadge contacted={quote.contacted} />
                    </TableCell>
                    <TableCell>
                      {quote.source ? (
                        <Badge variant="outline">{quote.source}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </Link>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function QuoteDetailView({
  state,
  onBack,
  onRetry,
}: {
  readonly state: QuoteDetailState;
  readonly onBack: () => void;
  readonly onRetry: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <Button
          className="gap-1.5"
          onClick={onBack}
          size="sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeftIcon className="size-4" />
          Back to quotes
        </Button>
        {state.status === "ready" ? (
          <Badge variant="secondary">Quote #{state.quote.id}</Badge>
        ) : state.status === "loading" ? (
          <Badge variant="outline">Quote #{state.id}</Badge>
        ) : (
          <Badge variant="outline">Quote #{state.id}</Badge>
        )}
      </div>

      {state.status === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading quote...
        </div>
      ) : state.status === "error" ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-2 py-6">
            <p className="text-sm text-destructive">{state.message}</p>
            <Button onClick={onRetry} size="sm" variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <QuoteDetail quote={state.quote} />
      )}
    </div>
  );
}

function QuoteDetail({ quote }: { readonly quote: QuoteRow }) {
  const adults = quote.adults ?? 0;
  const teenagers = quote.teenagers ?? 0;
  const children = quote.children ?? 0;
  const familyTotal = adults + teenagers + children;
  const solutionType = quote.completeSolution
    ? "Complete solution"
    : quote.offGrid
      ? "Off-grid"
      : "Standard";

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              {formatQuoteName(quote)}
            </CardTitle>
            <CardDescription>
              Quote #{quote.id} · submitted {formatDate(quote.created_at)}
            </CardDescription>
          </div>
          <ContactedBadge contacted={quote.contacted} />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            icon={MailIcon}
            label="Email"
            value={quote.email ?? "—"}
          />
          <DetailItem
            icon={PhoneIcon}
            label="Phone"
            value={quote.telephoneNumber ?? "—"}
          />
          <DetailItem
            icon={MapPinIcon}
            label="Location"
            value={formatQuoteLocation(quote)}
          />
          <DetailItem
            icon={CalendarIcon}
            label="Preferred contact"
            value={
              [quote.contactDay, quote.contactTime].filter(Boolean).join(" · ") ||
              "—"
            }
          />
          <DetailItem
            icon={BuildingIcon}
            label="House type"
            value={quote.houseType ?? "—"}
          />
          <DetailItem
            icon={UsersIcon}
            label="Household"
            value={`${familyTotal} (${adults} adults · ${teenagers} teens · ${children} kids)`}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Geyser requirements</CardTitle>
            <CardDescription>
              Current setup and the solution the customer wants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Geyser size" value={quote.geyserSize ? `${quote.geyserSize} L` : "—"} />
            <Row label="Electric geysers" value={String(quote.electric_geysers ?? 0)} />
            <Row label="Bathrooms" value={String(quote.bathrooms ?? 0)} />
            <Row
              label="Current sources"
              value={[
                quote.electricGeyser ? "Electric" : null,
                quote.solarGeyser ? "Solar" : null,
                quote.gasGeyser ? "Gas" : null,
                quote.otherGeyser ? String(quote.otherGeyser) : null,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            />
            <Row label="Solution type" value={solutionType} />
            <Row
              label="Install location"
              value={
                quote.locateOutside === null
                  ? "—"
                  : quote.locateOutside
                    ? "Outside"
                    : "Inside"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gas &amp; financing</CardTitle>
            <CardDescription>Cross-sell hooks and payment context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label="Gas stove"
              value={formatBool(quote.gasStove)}
            />
            <Row
              label="Gas heating"
              value={formatBool(quote.gasHeating)}
            />
            <Row
              label="Gas water heating"
              value={formatBool(quote.gasWaterHeating)}
            />
            <Row
              label="Other gas use"
              value={quote.otherGasUse ?? "—"}
            />
            <Row
              label="Borehole water"
              value={formatBool(quote.borehole_water)}
            />
            <Row label="Financing" value={quote.financing ?? "—"} />
            <Row
              label="Monthly savings"
              value={quote.monthlySavings ? `R ${quote.monthlySavings}` : "—"}
            />
          </CardContent>
        </Card>
      </div>

      {quote.comments ? (
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>Free-text notes from the customer.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {quote.comments}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </>
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
                <span className={cn("size-2.5 rounded-full", stage.color)} />
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

function PageHeader({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
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

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof MailIcon;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ContactedBadge({ contacted }: { readonly contacted: boolean | null }) {
  if (contacted === null) {
    return <Badge variant="outline">Unknown</Badge>;
  }

  return contacted ? (
    <Badge className="gap-1">
      <CheckCircle2Icon className="size-3" />
      Contacted
    </Badge>
  ) : (
    <Badge variant="secondary">New</Badge>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function formatBool(value: boolean | null): string {
  if (value === null) {
    return "—";
  }

  return value ? "Yes" : "No";
}

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