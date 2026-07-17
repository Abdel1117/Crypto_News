import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamMember from "../../app/components/TeamMembers/TeamMember";

describe("TeamMember", () => {
  it("renders the developer's name and role", () => {
    render(<TeamMember />);
    expect(screen.getByText("Abdel")).toBeTruthy();
    expect(screen.getByText("Full Stack Developer")).toBeTruthy();
  });
});
