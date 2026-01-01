import { redirect } from 'next/navigation';

export default function AskPage() {
  // Redirect to the new chat page
  redirect('/chat');
}
