/**
 * app/merch/page.tsx — Merch hub redirect to popular anime
 * Shown when user visits /merch directly (without a specific anime slug)
 */
import { redirect } from 'next/navigation';

export default function MerchIndex() {
  // Redirect to the most popular anime merch page as the hub
  redirect('/merch/demon-slayer');
}

export const metadata = {
  title: 'Anime Merch Shop | AnimePulse',
  description: 'Find official anime merchandise, manga, Blu-ray, and collectibles for your favourite series.',
};
