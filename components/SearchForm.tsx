import React from "react";
import { useRouter } from "next/router";

const SearchForm: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();

  const search: React.EventHandler<React.SyntheticEvent> = (
    event: React.SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const { query } = event.currentTarget;
    if (!query || (query && !query.value)) {
      return;
    }

    router.push({
      pathname: "/search",
      query: {
        q: query.value,
      },
    });

    event.currentTarget.reset();
  };

  return (
    <form
      className={`h-full flex-col lg:flex-row justify-between items-center ${className}`}
      onSubmit={search}
    >
      <input
        type="text"
        name="query"
        className="h-10 w-full lg:w-auto flex-1 rounded-xl px-3 py-3 lg:py-0 placeholder-loopring-lightBlue placeholder-opacity-70"
        placeholder="Search for block, tx, account ID, Collection Address"
        onFocus={() => router.prefetch("/search")}
      />
      <button
        type="submit"
        className="bg-loopring-darkBlue mt-4 lg:mt-0 py-1 px-10 ml-2 rounded-xl text-white h-10 dark:bg-loopring-dark-blue"
      >
        Search
      </button>
    </form>
  );
};

export default SearchForm;
