import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/hooks/use-currency";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function CurrencySelect() {
  const { code, setCode } = useCurrency();
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground">Estimated costs in</span>
    <Select value={code} onValueChange={(v) => void setCode(v as CurrencyCode)}>
      <SelectTrigger className="h-8 w-[92px] font-mono text-xs" aria-label="Estimated cost currency" title="Choose the currency used to display estimated conversation costs.">
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
    </div>
  );
}
