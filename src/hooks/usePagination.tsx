import React from "react";
import { PageInfo } from "@/plugintypes";

export const usePagination = (currentPage?: PageInfo) => {
  const [page, setPage] = React.useState<PageInfo>();

  const resetPage = () => {
    setPage(undefined);
  }

  if (!currentPage) {
    return {
      page: undefined,
      hasPreviousPage: false,
      hasNextPage: false,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onPreviousPage: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onNextPage: () => {},
      resetPage,
    };
  }

  const hasPreviousPage = (currentPage.offset ?? 0) !== 0;
  const nextOffset =
    currentPage.offset && currentPage.resultsPerPage
      ? currentPage.offset + currentPage.resultsPerPage
      : undefined;
  // If no totalResults just check if nextPage exists
  const hasNextPage = currentPage.totalResults
    ? nextOffset && nextOffset < currentPage.totalResults
    : !!currentPage.nextPage;

  const prevOffset = currentPage.offset && currentPage.resultsPerPage
    ? currentPage.offset - currentPage.resultsPerPage
    : undefined;
  const prevPage: PageInfo = {
    offset: prevOffset,
    resultsPerPage: currentPage.resultsPerPage,
    page: currentPage.prevPage,
  };
  const onPreviousPage = () => {
    const newPage: PageInfo = {
      offset: prevOffset,
      totalResults: currentPage.totalResults,
      resultsPerPage: currentPage.resultsPerPage,
      prevPage: currentPage.prevPage,
    };
    setPage(newPage);
  };

  const nextPage: PageInfo = {
    offset: nextOffset,
    page: currentPage.nextPage,
    resultsPerPage: currentPage.resultsPerPage,
  };
  const onNextPage = () => {
    const newPage: PageInfo = {
      offset: nextOffset,
      totalResults: currentPage.totalResults,
      resultsPerPage: currentPage.resultsPerPage,
      nextPage: currentPage.nextPage,
    };
    setPage(newPage);
  };

  return {
    page,
    resetPage,
    hasPreviousPage,
    hasNextPage,
    onPreviousPage,
    onNextPage,
    nextPage,
    prevPage,
  }
}