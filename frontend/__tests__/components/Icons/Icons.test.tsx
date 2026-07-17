import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { ArrowLeft } from "../../../app/components/Icons/ArrowLeft";
import { ArrowRight } from "../../../app/components/Icons/ArrowRight";
import { AuthIcon } from "../../../app/components/Icons/AuthIcon";
import { CloseMenuIcon } from "../../../app/components/Icons/CloseMenuIcon";
import { CryptoLogo } from "../../../app/components/Icons/CryptoLogo";
import { DashBoardIcon } from "../../../app/components/Icons/DashBoardIcon";
import { FacebookIcon } from "../../../app/components/Icons/FacebookIcon";
import { GithubIcon } from "../../../app/components/Icons/GithubIcon";
import { GoogleIcon } from "../../../app/components/Icons/GoogleIcon";
import { HomeIcon } from "../../../app/components/Icons/HomeIcon";
import { LinkedinIcon } from "../../../app/components/Icons/LinkedinIcon";
import { MessageIcon } from "../../../app/components/Icons/MessageIcon";
import { ParamIcons } from "../../../app/components/Icons/ParamIcons";
import { PinterestIcon } from "../../../app/components/Icons/PinterestIcon";
import { RingIcon } from "../../../app/components/Icons/RingIcon";
import { SearchIcon } from "../../../app/components/Icons/SearchIcon";
import { SimulationIcon } from "../../../app/components/Icons/SimulationIcon";
import { SpecialPageIcon } from "../../../app/components/Icons/SpecialPageIcon";
import { UserIcon } from "../../../app/components/Icons/UserIcon";
import { UtilitiesIcon } from "../../../app/components/Icons/UtilitiesIcon";
import { XIcon } from "../../../app/components/Icons/XIcon";
import { YoutubeIcon } from "../../../app/components/Icons/YoutubeIcon";

const icons: Array<[string, React.ComponentType<React.SVGProps<SVGSVGElement>>]> = [
  ["ArrowLeft", ArrowLeft],
  ["ArrowRight", ArrowRight],
  ["AuthIcon", AuthIcon],
  ["CloseMenuIcon", CloseMenuIcon],
  ["CryptoLogo", CryptoLogo],
  ["DashBoardIcon", DashBoardIcon],
  ["FacebookIcon", FacebookIcon],
  ["GithubIcon", GithubIcon],
  ["GoogleIcon", GoogleIcon],
  ["HomeIcon", HomeIcon],
  ["LinkedinIcon", LinkedinIcon],
  ["MessageIcon", MessageIcon],
  ["ParamIcons", ParamIcons],
  ["PinterestIcon", PinterestIcon],
  ["RingIcon", RingIcon],
  ["SearchIcon", SearchIcon],
  ["SimulationIcon", SimulationIcon],
  ["SpecialPageIcon", SpecialPageIcon],
  ["UserIcon", UserIcon],
  ["UtilitiesIcon", UtilitiesIcon],
  ["XIcon", XIcon],
  ["YoutubeIcon", YoutubeIcon],
];

describe.each(icons)("%s", (_name, Icon) => {
  it("renders an svg element and forwards extra props", () => {
    const { container } = render(<Icon data-testid="icon" className="text-red-500" />);
    const svg = container.querySelector("svg");

    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("data-testid")).toBe("icon");
    expect(svg?.getAttribute("class")).toContain("text-red-500");
  });
});
