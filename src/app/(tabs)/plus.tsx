import { Redirect } from 'expo-router';

/** Placeholder route for the central "+" tab; the button itself opens the add sheet. */
export default function Plus() {
  return <Redirect href="/add" />;
}
