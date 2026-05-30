import { QuizEditor } from "@/components/QuizEditor";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuizEditor quizId={id} />;
}
