"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";
import { useEffect } from "react";

// Zod schema for form validation
const studentRecordSchema = z.object({
  userData: z.object({
    // userId is now derived from the URL, but still part of the form data
    userId: z.coerce.number().int().positive(),
    nim: z.string().min(1, "NIM is required"),
    program: z.enum(["IF", "STI"]),
    fullName: z.string().min(1, "Full name is required"),
  }),
  grades: z.array(
    z.object({
      courseCode: z.string().min(1, "Course selection is required"),
      grade: z.coerce.number().min(0).max(4, "Grade must be between 0 and 4"),
    })
  ),
});

type StudentRecordInput = z.infer<typeof studentRecordSchema>;

interface Course {
  code: string;
  name: string;
  credits: number;
}

const fetchCourses = async (): Promise<Course[]> => {
  const response = await fetch(`${API_BASE_URL}/api/courses`);
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }
  return response.json();
};

// The component now accepts params for the dynamic route
const AddStudentRecordPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const studentId = parseInt(params.id, 10);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<StudentRecordInput>({
    resolver: zodResolver(studentRecordSchema),
    // Set default values, including the studentId from the URL
    defaultValues: {
      userData: {
        userId: studentId,
        nim: "",
        program: "IF",
        fullName: "",
      },
      grades: [{ courseCode: "", grade: 0 }],
    },
  });

  // Ensure userId is correctly set if the component re-renders
  useEffect(() => {
    setValue("userData.userId", studentId);
  }, [studentId, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "grades",
  });

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<
    Course[]
  >({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const mutation = useMutation({
    mutationFn: (newRecord: StudentRecordInput) => {
      return fetch(`${API_BASE_URL}/api/student-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });
    },
    onSuccess: async (response) => {
      if (response.ok) {
        alert("Student record added successfully!");
        router.push("/");
      } else {
        const errorData = await response.json();
        alert(`Failed to add record: ${errorData.error}`);
      }
    },
    onError: (error) => {
      alert(`An error occurred: ${error.message}`);
    },
  });

  const onSubmit = (data: StudentRecordInput) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-white">
      <header className="w-full max-w-4xl flex justify-between items-center py-4 px-2 md:px-0 mb-6">
        <h1 className="text-3xl font-bold">Add Student Record</h1>
        <button
          onClick={() => router.push("/")}
          className="bg-gray-600 text-white py-2 px-5 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          Back to Dashboard
        </button>
      </header>

      <main className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-8 rounded-xl shadow-2xl max-w-4xl w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-b border-gray-400 pb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">
              Student Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="userId"
                  className="block text-sm font-medium text-gray-300"
                >
                  Student ID
                </label>
                <input
                  id="userId"
                  type="number"
                  {...register("userData.userId")}
                  className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm text-gray-400 p-2 cursor-not-allowed"
                  disabled // Make the field read-only
                />
              </div>
              <div>
                <label
                  htmlFor="nim"
                  className="block text-sm font-medium text-gray-300"
                >
                  NIM
                </label>
                <input
                  id="nim"
                  {...register("userData.nim")}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
                />
                {errors.userData?.nim && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.userData.nim.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-300"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  {...register("userData.fullName")}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
                />
                {errors.userData?.fullName && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.userData.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="program"
                  className="block text-sm font-medium text-gray-300"
                >
                  Program
                </label>
                <select
                  id="program"
                  {...register("userData.program")}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
                >
                  <option value="IF">Informatics</option>
                  <option value="STI">Information Systems</option>
                </select>
                {errors.userData?.program && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.userData.program.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Grades</h2>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-4 p-4 bg-white bg-opacity-5 rounded-lg"
              >
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Course
                  </label>
                  <select
                    {...register(`grades.${index}.courseCode`)}
                    className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
                    disabled={isLoadingCourses}
                  >
                    <option value="">
                      {isLoadingCourses ? "Loading..." : "Select a course"}
                    </option>
                    {courses.map((course) => (
                      <option key={course.code} value={course.code}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                  {errors.grades?.[index]?.courseCode && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.grades[index]?.courseCode?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Grade
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`grades.${index}.grade`)}
                    className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
                  />
                  {errors.grades?.[index]?.grade && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.grades[index]?.grade?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-1 flex justify-end items-end h-full">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ courseCode: "", grade: 0 })}
              className="mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Add Grade
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition disabled:opacity-50"
            >
              {mutation.isPending ? "Submitting..." : "Submit Record"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddStudentRecordPage;
