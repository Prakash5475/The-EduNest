import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listMyTickets,
  createTicket,
  replyToTicket,
  type SupportCategory,
  type SupportPriority,
} from "@/services/supportService";

export function useSupportTickets() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => listMyTickets(1, 50),
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Support ticket submitted — we'll respond soon");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't submit ticket"),
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) => replyToTicket(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Reply sent");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't send reply"),
  });

  async function submitTicket(payload: {
    subject: string;
    description: string;
    category: SupportCategory;
    priority: SupportPriority;
  }) {
    await createMutation.mutateAsync(payload);
  }

  async function reply(ticketId: string, message: string) {
    if (!message.trim()) return;
    await replyMutation.mutateAsync({ ticketId, message });
  }

  return {
    tickets: data?.items ?? [],
    loading: isLoading,
    reply,
    submitTicket,
    isSubmitting: createMutation.isPending,
    isReplying: replyMutation.isPending,
  };
}
