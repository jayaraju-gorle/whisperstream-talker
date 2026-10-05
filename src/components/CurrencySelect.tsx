import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/hooks/use-currency";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function CurrencySelect() {
  const { code, setCode } = useCurrency();
  return (
    <Select value={code} onValueChange={(v) => void setCode(v as CurrencyCode)}>
      <SelectTrigger className="h-8 w-[92px] font-mono text-xs" aria-label="Currency">
        <SelectValue>{code}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code} className="text-xs">
            <span className="font-mono">{c.code}</span> <span className="text-muted-foreground">· {c.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
