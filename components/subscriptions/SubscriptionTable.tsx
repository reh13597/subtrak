"use client";

import { useState, useMemo } from "react";
import { Search, MoreHorizontal, Pencil, Trash2, CreditCard } from "lucide-react";
import type { SubscriptionItem } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const statusColors: Record<SubscriptionItem["status"], string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PAUSED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface SubscriptionTableProps {
  subscriptions: SubscriptionItem[];
  onSelect: (subscription: SubscriptionItem) => void;
  onEdit: (subscription: SubscriptionItem) => void;
  onDelete: (id: number) => void;
}

export function SubscriptionTable({
  subscriptions,
  onSelect,
  onEdit,
  onDelete,
}: SubscriptionTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch = sub.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, search, statusFilter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <Input
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white/5 border-white/10 text-white rounded-xl">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0a] border-white/10">
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
              <CreditCard size={28} />
            </div>
            <p className="text-white font-bold">No subscriptions found</p>
            <p className="text-white/40 text-sm">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest">
                  Name
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest">
                  Price
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest hidden md:table-cell">
                  Cycle
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest">
                  Status
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest hidden lg:table-cell">
                  Next Billing
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest w-[50px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="border-white/5 hover:bg-white/5 cursor-pointer transition"
                  onClick={() => onSelect(sub)}
                >
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center gap-3">
                      {sub.icon && <span className="text-xl">{sub.icon}</span>}
                      <div>
                        <p className="font-bold">{sub.name}</p>
                        {sub.category && <p className="text-white/40 text-xs">{sub.category}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    {formatPrice(sub.price, sub.currency)}
                  </TableCell>
                  <TableCell className="text-white/60 hidden md:table-cell capitalize">
                    {sub.billingCycle.toLowerCase()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-full text-xs font-semibold border",
                        statusColors[sub.status]
                      )}
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60 hidden lg:table-cell">
                    {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/40 hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Actions for ${sub.name}`}
                        >
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#0a0a0a] border-white/10"
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(sub);
                          }}
                          className="cursor-pointer"
                        >
                          <Pencil size={14} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(sub.id);
                          }}
                          className="cursor-pointer text-red-400 focus:text-red-400"
                        >
                          <Trash2 size={14} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
