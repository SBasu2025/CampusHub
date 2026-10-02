import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "../../../lib/api/endpoints/subjects";

import type {
  Subject,
} from "../../../lib/api/types";

// ============================================================
// SUBJECTS
// ============================================================

export function useSubjects(
  courseId?: string,
) {
  return useQuery({
    queryKey: [
      "subjects",
      courseId ?? "",
    ],

    queryFn: () =>
      getSubjects(
        courseId ||
          undefined,
      ),

    staleTime: 60_000,
  });
}

// ============================================================
// CREATE SUBJECT
// ============================================================

export function useCreateSubject() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      subject: Subject,
    ) =>
      createSubject(
        subject,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          "subjects",
        ],
      });

      // Subject is nested inside Teaching
      // and ClassSession responses.
      void queryClient.invalidateQueries({
        queryKey: [
          "teachings",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "class-sessions",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-subjects",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
        ],
      });
    },
  });
}

// ============================================================
// UPDATE SUBJECT
// ============================================================

export function useUpdateSubject() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      subject,
    }: {
      id: string;

      subject: Subject;
    }) =>
      updateSubject(
        id,
        subject,
      ),

    onSuccess: (
      updatedSubject: Subject,
    ) => {
      queryClient.setQueryData<
        Subject[]
      >(
        [
          "subjects",
          "",
        ],
        (current) => {
          if (!current) {
            return current;
          }

          return current.map(
            (subject) =>
              subject.subjectId ===
              updatedSubject.subjectId
                ? updatedSubject
                : subject,
          );
        },
      );

      void queryClient.invalidateQueries({
        queryKey: [
          "subjects",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "teachings",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "class-sessions",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-subjects",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
        ],
      });
    },
  });
}

// ============================================================
// DELETE SUBJECT
// ============================================================

export function useDeleteSubject() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      subjectId: string,
    ) =>
      deleteSubject(
        subjectId,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          "subjects",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "teachings",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "class-sessions",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-subjects",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
        ],
      });
    },
  });
}