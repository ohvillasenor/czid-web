import { isEmpty } from "lodash/fp";
import React from "react";
import AnnouncementBanner from "~/components/common/AnnouncementBanner";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import ToastContainer from "~ui/containers/ToastContainer";
import { CZIDLogoReversed } from "~ui/icons";

import MainMenu from "./MainMenu";
import UserMenuDropDown, { TermsMenuDropDown } from "./UserMenuDropDown";
import cs from "./header.scss";

interface HeaderProps {
  adminUser: boolean;
  announcementBannerEnabled: boolean;
  emergencyBannerMessage: string;
  disableNavigation: boolean;
  showBlank: boolean;
  userSignedIn: boolean;
  email: string;
  signOutEndpoint: string;
  userName: string;
}

const Header = ({
  adminUser,
  announcementBannerEnabled,
  disableNavigation,
  showBlank,
  userSignedIn,
  emergencyBannerMessage,
  email,
  signOutEndpoint,
  userName,
}: HeaderProps) => {
  if (showBlank) {
    return (
      <div className={cs.header}>
        <div className={cs.logo}>
          <CZIDLogoReversed className={cs.icon} />
        </div>
      </div>
    );
  }
  return (
    <div>
      <AnnouncementBanner
        id="emergency"
        visible={!isEmpty(emergencyBannerMessage)}
        message={emergencyBannerMessage}
      />
      <AnnouncementBanner
        id="jan_1_policy_changes"
        visible={announcementBannerEnabled}
        inverted={true}
        message={
          <>
            {
              "Effective 12/1/2022, samples will not automatically go public after 1 year. Our policies will update to reflect this and other changes on 1/1/23. Here is a "
            }
            <ExternalLink href="https://chanzuckerberg.zendesk.com/hc/en-us/articles/11278218026900">
              <span
                style={{
                  color: "white",
                  textDecoration: "underline",
                  textDecorationStyle: "dashed",
                }}
              >
                preview of all updates
              </span>
            </ExternalLink>
            {"."}
          </>
        }
      />
      <div className={cs.header}>
        <div className={cs.logo}>
          <a href="/">
            <CZIDLogoReversed className={cs.icon} />
          </a>
        </div>
        <div className={cs.fill} />
        {!disableNavigation && (
          <MainMenu adminUser={adminUser} userSignedIn={userSignedIn} />
        )}
        {!disableNavigation &&
          (userSignedIn ? (
            <UserMenuDropDown
              adminUser={adminUser}
              email={email}
              signOutEndpoint={signOutEndpoint}
              userName={userName}
            />
          ) : (
            <TermsMenuDropDown />
          ))}
      </div>
      {/* Initialize the toast container - can be done anywhere (has absolute positioning) */}
      <ToastContainer />
      {userSignedIn && (
        <iframe
          title="background_refresh"
          className={cs.backgroundRefreshFrame}
          src="/auth0/background_refresh"
        />
      )}
    </div>
  );
};

export default Header;
