import { useLinks } from '@/hooks/useLinks';
import LinkGrid from '@/components/links/LinkGrid';
import PageHeader from '@/components/ui/PageHeader';

export default function Archive() {
  const { data, isLoading } = useLinks({ view: 'archive', limit: 60 });
  return (
    <div className="animate-fade-in">
      <PageHeader title="Archive" subtitle="Links you've put away for safekeeping" />
      <LinkGrid links={data?.items} loading={isLoading} emptyLabel="Your archive is empty" />
    </div>
  );
}
