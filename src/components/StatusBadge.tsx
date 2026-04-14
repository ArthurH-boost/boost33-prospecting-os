const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  scraping: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  draft: 'bg-gray-500/20 text-gray-400',
  ready: 'bg-blue-500/20 text-blue-400',
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-purple-500/20 text-purple-400',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
}
