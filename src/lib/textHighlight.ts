import React from "react";

interface HighlightTextProps {
  text: string;
  searchQuery: string;
  className?: string;
  highlightBackgroundColor?: string;
  highlightTextColor?: string;
}

export function highlightText(
  text: string,
  searchQuery: string,
  className = "",
  highlightBackgroundColor = "rgba(0, 0, 0, 0.1)", // Accessible default background color
  highlightTextColor = "#000000", // Accessible default text color
): React.ReactNode {
  // Handle null/undefined inputs gracefully
  if (
    !text ||
    !searchQuery ||
    typeof text !== "string" ||
    typeof searchQuery !== "string"
  ) {
    return text || "";
  }

  if (!searchQuery.trim() || !text) {
    return text;
  }

  // Split search query into individual terms and filter out empty strings
  const searchTerms = searchQuery
    .toLowerCase()
    .split(" ")
    .filter((term) => term.length > 0);

  if (searchTerms.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the search terms (case-insensitive)
  const pattern = searchTerms
    .map((term) =>
      // Escape special regex characters and create pattern for partial matching
      term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("|");

  const regex = new RegExp(`(${pattern})`, "gi");

  // Split the text by the regex pattern, keeping the delimiters
  const parts = text.split(regex);

  return parts
    .map((part, index) => {
      if (!part) return null;

      // Check if this part matches any search term (case-insensitive)
      const lowerPart = part.toLowerCase();
      const isMatch = searchTerms.some((term) => lowerPart.includes(term));

      if (isMatch) {
        return React.createElement(
          "mark",
          {
            key: index,
            className: className,
            style: {
              backgroundColor: highlightBackgroundColor,
              color: highlightTextColor,
              padding: "0",
            },
          },
          part,
        );
      }

      return part;
    })
    .filter((part) => part !== null);
}

// React component version for easier use in JSX
export function HighlightText({
  text,
  searchQuery,
  className = "",
  highlightBackgroundColor = "rgba(0, 0, 0, 0.1)",
  highlightTextColor = "#000000",
}: HighlightTextProps) {
  return React.createElement(
    React.Fragment,
    null,
    highlightText(
      text,
      searchQuery,
      className,
      highlightBackgroundColor,
      highlightTextColor,
    ),
  );
}

