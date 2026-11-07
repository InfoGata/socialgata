/** Search params of a post's "other discussions" page. */
export type DuplicatesSearch = {
  page?: string | number;
  sortId?: string;
};

export const validateDuplicatesSearch = (
  search: Record<string, unknown>
): DuplicatesSearch => ({
  page: search.page as string | number | undefined,
  sortId: search.sortId as string | undefined,
});
