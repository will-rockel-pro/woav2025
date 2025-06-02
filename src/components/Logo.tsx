import Link from 'next/link';
import { Archive } from 'lucide-react';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
      <Archive className="h-7 w-7" />
      <span className="font-headline text-2xl font-semibold">WOAV Lite</span>
    </Link>
  );
}
