import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUpdateUserName = jest.fn();
const mockDeleteAccount = jest.fn();
const mockUserDelete = jest.fn();
const mockReplace = jest.fn();

jest.mock("convex/react", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
}));

jest.mock("../../convex/_generated/api", () => ({
  api: {
    profiles: {
      getUserProfile: "profiles:getUserProfile",
      updateUserName: "profiles:updateUserName",
      deleteAccount: "profiles:deleteAccount",
    },
    emailSubscriptions: {
      getMySubscription: "emailSubscriptions:getMySubscription",
      subscribe: "emailSubscriptions:subscribe",
      updateRoleFilters: "emailSubscriptions:updateRoleFilters",
      unsubscribeFromProfile: "emailSubscriptions:unsubscribeFromProfile",
    },
  },
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

jest.mock("../../src/components/SiteFooter", () => () => <footer data-testid="site-footer" />);

import ProfilePage from "@/components/ProfilePage";

describe("ProfilePage account deletion", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    const mockProfile = {
      id: "user-1",
      email: "test@example.com",
      fullName: "Test User",
      role: "user",
    };

    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });

    (useUser as jest.Mock).mockReturnValue({
      user: {
        delete: mockUserDelete,
        updatePassword: jest.fn(),
      },
      isLoaded: true,
    });

    mockUseQuery.mockImplementation((reference: string) => {
      if (reference === "profiles:getUserProfile") {
        return mockProfile;
      }

      if (reference === "emailSubscriptions:getMySubscription") {
        return null;
      }

      return undefined;
    });

    mockUseMutation.mockImplementation((reference: string) => {
      if (reference === "profiles:updateUserName") {
        return mockUpdateUserName;
      }
      if (reference === "profiles:deleteAccount") {
        return mockDeleteAccount;
      }
      return jest.fn();
    });
  });

  const openDeleteModal = async () => {
    render(<ProfilePage />);
    fireEvent.click(await screen.findByRole("button", { name: "Security" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete My Account" }));
  };

  it("deletes account, stores pending toast, and redirects to home", async () => {
    mockDeleteAccount.mockResolvedValue({
      success: true,
      deletedTrackedApplicationsCount: 2,
      deletedProfile: true,
    });
    mockUserDelete.mockResolvedValue(undefined);

    await openDeleteModal();
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete my account" }));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    });
    expect(mockUserDelete).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/");

    const pendingToast = sessionStorage.getItem("pendingToast");
    expect(pendingToast).not.toBeNull();
    expect(JSON.parse(pendingToast as string)).toEqual({
      message: "Account successfully deleted",
      type: "success",
    });
  });

  it("shows error and does not redirect when convex delete fails", async () => {
    mockDeleteAccount.mockRejectedValue(new Error("Failed to delete account data"));
    mockUserDelete.mockResolvedValue(undefined);

    await openDeleteModal();
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete my account" }));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    });

    expect(mockUserDelete).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(await screen.findByText("Failed to delete account data")).toBeInTheDocument();
    expect(sessionStorage.getItem("pendingToast")).toBeNull();
  });

  it("shows error and does not redirect when clerk delete fails", async () => {
    mockDeleteAccount.mockResolvedValue({
      success: true,
      deletedTrackedApplicationsCount: 0,
      deletedProfile: true,
    });
    mockUserDelete.mockRejectedValue(new Error("Failed to delete account"));

    await openDeleteModal();
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete my account" }));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    });

    expect(mockUserDelete).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(await screen.findByText("Failed to delete account")).toBeInTheDocument();
    expect(sessionStorage.getItem("pendingToast")).toBeNull();
  });
});
