import { useParams } from 'react-router-dom';
import PublicLeadDetail from '@/components/public/PublicLeadDetail';

export default function PublicLeadPage() {
  const { id } = useParams();
  if (!id || typeof id !== 'string') {
    return null;
  }
  return <PublicLeadDetail leadId={id} />;
}
