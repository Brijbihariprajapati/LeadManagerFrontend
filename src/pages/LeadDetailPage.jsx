import { useParams } from 'react-router-dom';
import LeadDetailView from '@/components/leads/LeadDetailView';

export default function LeadDetailPage() {
  const { id } = useParams();

  if (!id || typeof id !== 'string') {
    return null;
  }

  return <LeadDetailView leadId={id} />;
}
