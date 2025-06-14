import { AddStudentRecordForm } from "./AddStudentRecordForm";

const AddStudentRecordPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const awaited = await params;
  const studentId = parseInt(awaited.id, 10);

  if (isNaN(studentId)) {
    throw new Error("Invalid student ID");
  }

  return <AddStudentRecordForm studentId={studentId} />;
};

export default AddStudentRecordPage;
