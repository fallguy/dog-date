import { supabase } from '@/lib/supabase';

/**
 * Best-effort wrapper around the `notify` edge function. Push notifications
 * should never block primary writes, so all errors are swallowed here.
 */
export async function notify(args: {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase.functions.invoke('notify', {
      body: {
        recipient_user_id: args.recipientUserId,
        title: args.title,
        body: args.body,
        data: args.data,
      },
    });
  } catch {
    // Silent — push notifications are best-effort.
  }
}
