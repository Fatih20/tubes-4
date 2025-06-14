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

const AddStudentRecordPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const router = useRouter();

  const awaited = await params;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<StudentRecordInput>({
    resolver: zodResolver(studentRecordSchema),
    defaultValues: {
      userData: {
        userId: 0, // Initialize with a placeholder value
        nim: "",
        program: "IF",
        fullName: "",
      },
      grades: [{ courseCode: "", grade: 0 }],
    },
  });

  // This useEffect hook now safely handles the studentId from params.
  useEffect(() => {
    const studentId = parseInt(awaited.id, 10);
    if (!isNaN(studentId)) {
      setValue("userData.userId", studentId, { shouldValidate: true });
    }
  }, [awaited.id, setValue]);

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

  const inputStyle =
    "mt-1 block w-full bg-white bg-opacity-70 border border-white border-opacity-30 rounded-md shadow-sm text-gray-900 p-2 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder-gray-600";
  const disabledInputStyle =
    "mt-1 block w-full bg-gray-200 bg-opacity-50 border-transparent rounded-md shadow-sm text-gray-700 p-2 cursor-not-allowed";

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <header className="w-full max-w-6xl flex justify-between items-center py-4 px-2 md:px-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Add Student Record
        </h1>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-500 text-white py-2 px-4 sm:py-2 sm:px-5 rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg whitespace-nowrap"
        >
          Back to Dashboard
        </button>
      </header>

      <main className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl max-w-6xl w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Information Section */}
          <div className="border-b border-white border-opacity-30 pb-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">
              Student Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="userId"
                  className="block text-sm font-medium text-slate-700"
                >
                  Student ID
                </label>
                <input
                  id="userId"
                  type="number"
                  {...register("userData.userId")}
                  className={disabledInputStyle}
                  disabled
                />
              </div>
              <div>
                <label
                  htmlFor="nim"
                  className="block text-sm font-medium text-slate-700"
                >
                  NIM
                </label>
                <input
                  id="nim"
                  {...register("userData.nim")}
                  className={inputStyle}
                />
                {errors.userData?.nim && (
                  <p className="text-red-800 text-sm mt-1">
                    {errors.userData.nim.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  {...register("userData.fullName")}
                  className={inputStyle}
                />
                {errors.userData?.fullName && (
                  <p className="text-red-800 text-sm mt-1">
                    {errors.userData.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="program"
                  className="block text-sm font-medium text-slate-700"
                >
                  Program
                </label>
                <select
                  id="program"
                  {...register("userData.program")}
                  className={inputStyle}
                >
                  <option value="IF" className="text-black">
                    Informatics
                  </option>
                  <option value="STI" className="text-black">
                    Information Systems
                  </option>
                </select>
                {errors.userData?.program && (
                  <p className="text-red-800 text-sm mt-1">
                    {errors.userData.program.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Grades Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-800">
              Grades
            </h2>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-4 p-4 rounded-lg"
              >
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Course
                  </label>
                  <select
                    {...register(`grades.${index}.courseCode`)}
                    className={inputStyle}
                    disabled={isLoadingCourses}
                  >
                    <option value="" className="text-gray-500">
                      {isLoadingCourses ? "Loading..." : "Select a course"}
                    </option>
                    {courses.map((course) => (
                      <option
                        key={course.code}
                        value={course.code}
                        className="text-black"
                      >
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                  {errors.grades?.[index]?.courseCode && (
                    <p className="text-red-800 text-sm mt-1">
                      {errors.grades[index]?.courseCode?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Grade
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`grades.${index}.grade`)}
                    className={inputStyle}
                  />
                  {errors.grades?.[index]?.grade && (
                    <p className="text-red-800 text-sm mt-1">
                      {errors.grades[index]?.grade?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-1 flex justify-end items-end h-full">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ courseCode: "", grade: 0 })}
              className="mt-2 bg-purple-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md"
            >
              Add Grade
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full sm:w-auto bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg disabled:opacity-50"
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
