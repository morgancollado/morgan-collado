"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NextLink from "next/link";
import {
  Box,
  Divider,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";

const components = {
  h1: ({ node, ...props }) => (
    <Typography variant="h3" component="h2" sx={{ mt: 5, mb: 2 }} {...props} />
  ),
  h2: ({ node, ...props }) => (
    <Typography variant="h4" component="h2" sx={{ mt: 4, mb: 2 }} {...props} />
  ),
  h3: ({ node, ...props }) => (
    <Typography variant="h5" component="h3" sx={{ mt: 3, mb: 1.5 }} {...props} />
  ),
  h4: ({ node, ...props }) => (
    <Typography variant="h6" component="h4" sx={{ mt: 3, mb: 1 }} {...props} />
  ),
  h5: ({ node, ...props }) => (
    <Typography variant="subtitle1" component="h5" sx={{ mt: 2, mb: 1, fontWeight: 700 }} {...props} />
  ),
  h6: ({ node, ...props }) => (
    <Typography variant="subtitle2" component="h6" sx={{ mt: 2, mb: 1, fontWeight: 700 }} {...props} />
  ),
  p: ({ node, ...props }) => (
    <Typography variant="body1" sx={{ py: 1.5, textAlign: "left", lineHeight: 1.7 }} {...props} />
  ),
  a: ({ node, href, children, ...props }) => {
    const external = !!href && /^https?:\/\//.test(href);
    if (external) {
      return (
        <MuiLink href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </MuiLink>
      );
    }
    return (
      <MuiLink component={NextLink} href={href || "#"} {...props}>
        {children}
      </MuiLink>
    );
  },
  ul: ({ node, ...props }) => (
    <Box component="ul" sx={{ pl: 4, py: 1, "& li": { mb: 0.75 } }} {...props} />
  ),
  ol: ({ node, ...props }) => (
    <Box component="ol" sx={{ pl: 4, py: 1, "& li": { mb: 0.75 } }} {...props} />
  ),
  li: ({ node, checked, ordered, index, ...props }) => (
    <Typography component="li" variant="body1" sx={{ lineHeight: 1.6 }} {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <Box
      component="blockquote"
      sx={{
        borderLeft: 4,
        borderColor: "primary.main",
        pl: 2,
        my: 3,
        mx: 0,
        fontStyle: "italic",
        color: "text.secondary",
      }}
      {...props}
    />
  ),
  code: ({ node, ...props }) => (
    <Box
      component="code"
      sx={{
        fontFamily: "monospace",
        fontSize: "0.9em",
        bgcolor: "action.hover",
        px: 0.5,
        py: 0.25,
        borderRadius: 0.5,
      }}
      {...props}
    />
  ),
  pre: ({ node, ...props }) => (
    <Box
      component="pre"
      sx={{
        p: 2,
        my: 3,
        bgcolor: "action.hover",
        borderRadius: 1,
        overflowX: "auto",
        fontSize: "0.85rem",
        "& code": { bgcolor: "transparent", p: 0 },
      }}
      {...props}
    />
  ),
  hr: ({ node, ...props }) => <Divider sx={{ my: 4 }} {...props} />,
  img: ({ node, src, alt, ...props }) => (
    <Box
      component="img"
      src={src}
      alt={alt || ""}
      loading="lazy"
      sx={{
        display: "block",
        width: "100%",
        height: "auto",
        borderRadius: 1,
        my: 3,
        mx: "auto",
      }}
      {...props}
    />
  ),
  table: ({ node, ...props }) => (
    <TableContainer component={Paper} variant="outlined" sx={{ my: 3 }}>
      <Table size="small" {...props} />
    </TableContainer>
  ),
  thead: ({ node, ...props }) => <TableHead {...props} />,
  tbody: ({ node, ...props }) => <TableBody {...props} />,
  tr: ({ node, ...props }) => <TableRow {...props} />,
  th: ({ node, ...props }) => <TableCell sx={{ fontWeight: 700 }} {...props} />,
  td: ({ node, ...props }) => <TableCell {...props} />,
};

export default function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
