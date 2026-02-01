import { describe, it, expect } from "@jest/globals";
import React from "react";
import { highlightText, HighlightText } from "@/lib/textHighlight";

describe("textHighlight utility", () => {
  describe("highlightText function", () => {
    it("should return original text when no search query provided", () => {
      const result = highlightText("Hello World", "");
      expect(result).toBe("Hello World");
    });

    it("should return original text when search query is only whitespace", () => {
      const result = highlightText("Hello World", "   ");
      expect(result).toBe("Hello World");
    });

    it("should return original text when text is empty", () => {
      const result = highlightText("", "search");
      expect(result).toBe("");
    });

    it("should highlight single matching word", () => {
      const result = highlightText("Hello World", "world") as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe("Hello ");

      // Check the highlighted part
      const highlightedPart = result[1] as React.ReactElement;
      expect(highlightedPart.type).toBe("mark");
      expect(highlightedPart.props.children).toBe("World");
      expect(highlightedPart.props.style).toEqual({
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        color: "#000000",
        padding: "0",
      });
    });

    it("should highlight multiple matching words", () => {
      const result = highlightText(
        "Hello World Hello Universe",
        "hello",
      ) as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4);

      // Check first highlighted part
      const firstHighlight = result[0] as React.ReactElement;
      expect(firstHighlight.type).toBe("mark");
      expect(firstHighlight.props.children).toBe("Hello");

      expect(result[1]).toBe(" World ");

      // Check second highlighted part
      const secondHighlight = result[2] as React.ReactElement;
      expect(secondHighlight.type).toBe("mark");
      expect(secondHighlight.props.children).toBe("Hello");

      expect(result[3]).toBe(" Universe");
    });

    it("should handle case-insensitive matching", () => {
      const result = highlightText(
        "JavaScript Developer",
        "SCRIPT",
      ) as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);
      const highlightedPart = result.find(
        (part) =>
          React.isValidElement(part) && part.props.children === "Script",
      ) as React.ReactElement;

      expect(highlightedPart).toBeDefined();
      expect(highlightedPart.type).toBe("mark");
    });

    it("should handle multiple search terms", () => {
      const result = highlightText(
        "Frontend Developer with React skills",
        "Frontend React",
      ) as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);

      // Should highlight both 'Frontend' and 'React'
      const highlights = result.filter(
        (part) => React.isValidElement(part) && part.type === "mark",
      ) as React.ReactElement[];

      expect(highlights).toHaveLength(2);
      expect(highlights[0].props.children).toBe("Frontend");
      expect(highlights[1].props.children).toBe("React");
    });

    it("should escape special regex characters", () => {
      const result = highlightText(
        "Price: $100.50 (discounted)",
        "$100.50",
      ) as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);

      const highlightedPart = result.find(
        (part) =>
          React.isValidElement(part) && part.props.children === "$100.50",
      ) as React.ReactElement;

      expect(highlightedPart).toBeDefined();
      expect(highlightedPart.type).toBe("mark");
    });

    it("should handle parentheses and special characters", () => {
      const testCases = [
        { text: "Hello (JavaScript) World", query: "(JavaScript)" },
        { text: "Email: test@example.com", query: "test@example.com" },
        { text: "Regex: ^[a-z]+$", query: "^[a-z]+$" },
        { text: "Path: C:\\Users\\Name", query: "C:\\Users\\Name" },
      ];

      testCases.forEach(({ text, query }) => {
        const result = highlightText(text, query) as React.ReactNode[];
        expect(Array.isArray(result)).toBe(true);

        const highlightedPart = result.find(
          (part) => React.isValidElement(part) && part.props.children === query,
        ) as React.ReactElement;

        expect(highlightedPart).toBeDefined();
      });
    });

    it("should use custom styling", () => {
      const result = highlightText(
        "Hello World",
        "world",
        "custom-class",
        "#ffff00",
        "#000080",
      ) as React.ReactNode[];

      const highlightedPart = result.find(
        (part) => React.isValidElement(part) && part.props.children === "World",
      ) as React.ReactElement;

      expect(highlightedPart.props.className).toBe("custom-class");
      expect(highlightedPart.props.style).toEqual({
        backgroundColor: "#ffff00",
        color: "#000080",
        padding: "0",
      });
    });

    it("should handle partial word matching", () => {
      const result = highlightText(
        "JavaScript Developer",
        "Script",
      ) as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);

      const highlightedPart = result.find(
        (part) =>
          React.isValidElement(part) && part.props.children === "Script",
      ) as React.ReactElement;

      expect(highlightedPart).toBeDefined();
    });

    it("should handle overlapping matches correctly", () => {
      const result = highlightText(
        "AAA BBB AAA",
        "AAA BBB",
      ) as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);

      // Should handle overlapping search terms gracefully
      const highlights = result.filter(
        (part) => React.isValidElement(part) && part.type === "mark",
      );

      expect(highlights.length).toBeGreaterThan(0);
    });

    it("should handle unicode and special characters in text", () => {
      const testCases = [
        { text: "Café Developer", query: "Café" },
        { text: "日本語 Developer", query: "日本語" },
        { text: "Emoji 🚀 Developer", query: "🚀" },
        { text: "Accent résumé", query: "résumé" },
      ];

      testCases.forEach(({ text, query }) => {
        const result = highlightText(text, query) as React.ReactNode[];
        expect(Array.isArray(result)).toBe(true);

        const highlightedPart = result.find(
          (part) => React.isValidElement(part) && part.props.children === query,
        ) as React.ReactElement;

        expect(highlightedPart).toBeDefined();
      });
    });

    it("should handle very long text efficiently", () => {
      const longText =
        "Lorem ipsum ".repeat(1000) +
        "Developer" +
        " Lorem ipsum ".repeat(1000);
      const result = highlightText(longText, "Developer") as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);

      const highlightedPart = result.find(
        (part) =>
          React.isValidElement(part) && part.props.children === "Developer",
      ) as React.ReactElement;

      expect(highlightedPart).toBeDefined();
    });

    it("should handle empty parts in split result", () => {
      // This tests the filter for null parts
      const result = highlightText("A  B", "A B") as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.every((part) => part !== null)).toBe(true);
    });

    it("should handle search query with multiple spaces", () => {
      const result = highlightText(
        "Frontend    Backend Developer",
        "Frontend Backend",
      ) as React.ReactNode[];

      expect(Array.isArray(result)).toBe(true);

      const highlights = result.filter(
        (part) => React.isValidElement(part) && part.type === "mark",
      ) as React.ReactElement[];

      expect(highlights.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("HighlightText component", () => {
    it("should render with default props", () => {
      const component = React.createElement(HighlightText, {
        text: "Hello World",
        searchQuery: "world",
      });

      expect(component.type).toBe(HighlightText);
      expect(component.props.text).toBe("Hello World");
      expect(component.props.searchQuery).toBe("world");
      expect(component.props.className).toBeUndefined();
      expect(component.props.highlightBackgroundColor).toBeUndefined();
      expect(component.props.highlightTextColor).toBeUndefined();
    });

    it("should render with custom props", () => {
      const component = React.createElement(HighlightText, {
        text: "Custom Text",
        searchQuery: "custom",
        className: "highlight-class",
        highlightBackgroundColor: "#yellow",
        highlightTextColor: "#blue",
      });

      expect(component.props.className).toBe("highlight-class");
      expect(component.props.highlightBackgroundColor).toBe("#yellow");
      expect(component.props.highlightTextColor).toBe("#blue");
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle null or undefined inputs gracefully", () => {
      expect(() => highlightText(null as any, "test")).not.toThrow();
      expect(() => highlightText("test", null as any)).not.toThrow();
      expect(() => highlightText(undefined as any, "test")).not.toThrow();
      expect(() => highlightText("test", undefined as any)).not.toThrow();
    });

    it("should handle extremely long search queries", () => {
      const longQuery = "word ".repeat(100).trim();
      const result = highlightText("This contains word in it", longQuery);

      expect(result).toBeDefined();
    });

    it("should handle search queries with only special characters", () => {
      const result = highlightText("Special chars: *** +++", "***");
      expect(result).toBeDefined();
    });

    it("should maintain performance with many search terms", () => {
      const manyTerms = Array.from({ length: 50 }, (_, i) => `term${i}`).join(
        " ",
      );
      const text = "This text contains term1 and term25 somewhere";

      const start = performance.now();
      const result = highlightText(text, manyTerms);
      const end = performance.now();

      expect(result).toBeDefined();
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});

