import { redirect } from 'next/navigation';

/**
 * Root chat page - redirects to Dify implementation
 *
 * This can be replaced with a chat selection page in the future
 * to allow users to choose between different chat implementations
 * (Dify, Vercel AI SDK, etc.)
 */
export default function ChatPage() {
  redirect('/chat/dify');
}
