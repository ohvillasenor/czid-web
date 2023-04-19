import { gql, useMutation } from "@apollo/client";
import { isNull } from "lodash";
import { postWithCSRF, putWithCSRF } from "./core";

const CREATE_USER = gql`
  # Creates a new user

  mutation CreateUser(
    $name: String
    $email: String!
    $institution: String
    $role: Int
    $sendActivation: Boolean
    $archetypes: String
    $segments: String
  ) {
    createUser(
      name: $name
      email: $email
      institution: $institution
      role: $role
      sendActivation: $sendActivation
      archetypes: $archetypes
      segments: $segments
    ) {
      email
    }
  }
`;

// create_user.rb errors
const EMAIL_TAKEN_ERROR = "Email has already been taken";

const useCreateUser = () => {
  const [create, { loading, error }] = useMutation(CREATE_USER);

  if (loading) return "Submitting...";
  if (error) return `Submission error! ${error.message}`;

  return create;
};

interface userUpdateData {
  name: string;
  role?: number;
  email?: string;
  institution?: string;
  archetypes?: string;
  segments?: string;
  user_profile_form_version?: number;
}

const updateUser = ({
  userId,
  name,
  email,
  institution,
  isAdmin,
  archetypes,
  segments,
  userProfileFormVersion,
}: {
  userId: number;
  name: string;
  email?: string;
  isAdmin?: boolean;
  institution?: string;
  archetypes?: string;
  segments?: string;
  userProfileFormVersion?: number;
}) => {
  const userUpdateData: userUpdateData = {
    name: name,
    email: email,
  };

  // TODO (phoenix) update this once we make role optional on backend,
  // additionally i'm not sure if this logic is correct if we want to update the role of a user, punting to later!
  if (!isNull(isAdmin)) {
    userUpdateData.role = isAdmin ? 1 : 0;
  }

  // TODO (phoenix): email is required on backend, but should not be, stubbing this out for now
  if (!isNull(email)) {
    userUpdateData.email = email;
  }
  if (!isNull(institution)) {
    userUpdateData.institution = institution;
  }

  if (!isNull(archetypes)) {
    userUpdateData.archetypes = archetypes;
  }

  if (!isNull(segments)) {
    userUpdateData.segments = segments;
  }

  if (!isNull(userProfileFormVersion)) {
    userUpdateData.user_profile_form_version = userProfileFormVersion;
  }
  return putWithCSRF(`/users/${userId}.json`, {
    user: userUpdateData,
  });
};

interface userPostAirtableData {
  userId: number;
  firstName: string;
  lastName: string;
  profileFormVersion: number;
  rorInstitution: string;
  rorId: string;
  country: string;
  worldBankIncome: string;
  expertiseLevel: string;
  signUpPath?: string;
  czidUsecases: string[];
  referralSource: string[];
}

interface userPostAirtableDataAPI {
  first_name: string;
  last_name: string;
  profile_form_version: number;
  ror_institution: string;
  ror_id: string;
  country?: string;
  world_bank_income?: string;
  expertise_level: string;
  sign_up_path: string;
  czid_usecase: string[];
  referral_source: string[];
}

const postToAirtable = ({
  userId,
  firstName,
  lastName,
  profileFormVersion,
  rorInstitution,
  rorId,
  country,
  worldBankIncome,
  expertiseLevel,
  signUpPath,
  czidUsecases,
  referralSource,
}: userPostAirtableData) => {
  const userAirtableData: userPostAirtableDataAPI = {
    first_name: firstName,
    last_name: lastName,
    profile_form_version: profileFormVersion,
    ror_institution: rorInstitution,
    ror_id: rorId,
    country: country,
    world_bank_income: worldBankIncome,
    expertise_level: expertiseLevel,
    sign_up_path: signUpPath,
    czid_usecase: czidUsecases,
    referral_source: referralSource,
  };
  return postWithCSRF(`/users/${userId}/post_user_data_to_airtable`, {
    user: userAirtableData,
  });
};

const requestPasswordReset = (email: $TSFixMe) => {
  return postWithCSRF("/auth0/request_password_reset", {
    user: { email },
  });
};

export {
  useCreateUser,
  updateUser,
  requestPasswordReset,
  postToAirtable,
  EMAIL_TAKEN_ERROR,
};
