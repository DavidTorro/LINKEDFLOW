import { createBrowserRouter } from "react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { CommentsPage } from "../features/comments/presentation/CommentsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <CommentsPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
