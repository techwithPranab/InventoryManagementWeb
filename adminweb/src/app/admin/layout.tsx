import AdminLayout from '@/components/Admin/AdminLayout';

export default function Layout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
