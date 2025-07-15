export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} WOAV Lite. Built with Firebase Studio.</p>
      </div>
    </footer>
  );
}
