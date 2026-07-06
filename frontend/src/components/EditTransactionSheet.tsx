import { useState, type FormEvent } from "react";
import { useTransactionMutations } from "../api/hooks";
import { Sheet, Button, Input, DateField } from "./ui";
import type { Transaction } from "../types/api";

/** Edit an existing ledger entry's date / amount / note. Shared by the
 *  Transactions ledger and the Month view's expense drawer. */
export default function EditTransactionSheet({
  txn,
  year,
  onClose,
}: {
  txn: Transaction;
  year: number;
  onClose: () => void;
}) {
  const { update } = useTransactionMutations(year);
  const [txnDate, setTxnDate] = useState(txn.txn_date);
  const [amount, setAmount] = useState(String(txn.amount));
  const [note, setNote] = useState(txn.note ?? "");

  const save = () => {
    if (!amount || !txnDate) return;
    update.mutate(
      { id: txn.id, txn_date: txnDate, amount: Number(amount), note: note || null },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet open onClose={onClose} title="Edit expense">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); save(); }} className="mt-3 flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <DateField value={txnDate} onChange={setTxnDate} min={`${year}-01-01`} max={`${year}-12-31`} />
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ₹" className="num" />
        </div>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
        <Button type="submit" disabled={!amount || update.isPending} className="w-full justify-center py-4 text-[15px] font-extrabold">
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Sheet>
  );
}
