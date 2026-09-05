import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { EditJobForm } from "./components/edit-job-form";

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true }
  });

  if (!user || user.role !== "RECRUITER" || !user.companyId) {
    return <div>Unauthorized.</div>;
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id }
  });

  if (!job || job.companyId !== user.companyId) {
    return notFound();
  }

  return <EditJobForm job={job} />;
}
