import { useLinks } from '@/hooks/useLinks';
import LinkGrid from '@/components/links/LinkGrid';
import PageHeader from '@/components/ui/PageHeader';

export default function Favorites() {
  const { data, isLoading } = useLinks({ favorite: 'true', limit: 60 });
  return (
    <div className="animate-fade-in">
      <PageHeader title="Favorites" subtitle="Your starred links" />
      <LinkGrid links={data?.items} loading={isLoading} emptyLabel="Star a link to see it here" />
    </div>
  );
}
