import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect the root page straight to our new Client Dashboard
  redirect('/clients');
}
