"use client";

import { useState } from "react";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMPTY_INSTITUTION = { name: "", address: "", contactEmail: "", phoneNumber: "" };

export function validateInstitution(values) {
  const errors = {};
  if (values.name.trim().length < 3) errors.name = "Enter the institution's full name.";
  if (!values.address.trim()) errors.address = "Enter the address.";
  if (values.contactEmail && !EMAIL_RE.test(values.contactEmail.trim())) errors.contactEmail = "Enter a valid email address.";
  if (values.phoneNumber && values.phoneNumber.replace(/\D/g, "").length < 10) errors.phoneNumber = "Enter at least 10 digits.";
  return errors;
}

export function useInstitutionForm(initial = EMPTY_INSTITUTION) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const update = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const validate = () => {
    const next = validateInstitution(values);
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  return { values, setValues, errors, setErrors, update, validate };
}

export default function InstitutionFields({ form, id = "institution" }) {
  const { values, errors, update } = form;
  return (
    <div className="grid gap-5">
      <Input id={`${id}-name`} label="Institution name" name="name" leading={Building2} placeholder="e.g. St. Thomas College, Thrissur" value={values.name} onChange={update} error={errors.name} required />
      <Textarea id={`${id}-address`} label="Address" name="address" rows={3} placeholder="Street, city, district, PIN" value={values.address} onChange={update} error={errors.address} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id={`${id}-email`}
          label="Contact email"
          name="contactEmail"
          type="email"
          leading={Mail}
          placeholder="nss@college.edu"
          value={values.contactEmail}
          onChange={update}
          error={errors.contactEmail}
        />
        <Input
          id={`${id}-phone`}
          label="Phone number"
          name="phoneNumber"
          type="tel"
          leading={Phone}
          placeholder="+91 487 234 5678"
          value={values.phoneNumber}
          onChange={update}
          error={errors.phoneNumber}
        />
      </div>
      <p className="flex items-start gap-2 text-[13px] text-muted">
        <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Students, teachers, coordinators and alumni choose from this list when they sign up.
      </p>
    </div>
  );
}
