export const homePageQuery = `coalesce(*[_type == "homePage" && _id == "homePage"][0], *[_type == "homePage"] | order(_updatedAt desc)[0]) {
  title,
  summary,
  hero {
    badge,
    headline,
    description,
    primaryCtaLabel,
    secondaryCtaLabel,
    trustLine
  },
  valueProps[] {
    title,
    description
  },
  valuePropsSection {
    eyebrow,
    headline
  },
  journeySection {
    eyebrow,
    headline,
    description,
    steps[] {
      title,
      description,
      details
    }
  },
  sections {
    featuredPlansTitle,
    featuredPlansDescription,
    planGroupsTitle,
    planLocationsTitle,
    comparisonTitle,
    comparisonDescription
  },
  locationSection {
    eyebrow,
    headline,
    description,
    footerTitle,
    footerDescription,
    ctaLabel
  },
  testimonialsSection {
    eyebrow,
    headline,
    ratingLabel,
    items[] {
      quote,
      name,
      role
    }
  },
  faqPreviewSection {
    eyebrow,
    headline,
    description,
    ctaLabel,
    items[] {
      question,
      answer
    }
  },
  liveSupportSection {
    eyebrow,
    headline,
    description,
    topics[] {
      title,
      description
    }
  },
  finalCta {
    headline,
    description,
    primaryCtaLabel,
    secondaryCtaLabel
  },
  seoTitle,
  seoDescription
}`

export const siteSettingsQuery = `coalesce(*[_type == "siteSettings" && _id == "siteSettings"][0], *[_type == "siteSettings"] | order(_updatedAt desc)[0]) {
  brandName,
  headerLinks[] {
    label,
    href
  },
  footerLinks[] {
    label,
    href
  },
  footer {
    tagline,
    copyrightText,
    statusText,
    columns[] {
      title,
      links[] {
        label,
        href
      }
    }
  }
}`

export const faqPageQuery = `coalesce(*[_type == "faqPage" && _id == "faqPage"][0], *[_type == "faqPage"] | order(_updatedAt desc)[0]) {
  title,
  summary,
  items[] {
    question,
    answer
  },
  seoTitle,
  seoDescription
}`

export const legalPageQuery = `*[_type == "legalPage" && slug.current == $slug][0] {
  title,
  summary,
  body,
  seoTitle,
  seoDescription
}`
