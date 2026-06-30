import type { ChangeEvent, FC } from 'react';

import { SearchField } from '@components/core';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  return (
    <SearchField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size="sm"
      className="flex-1 sm:w-48"
    />
  );
};

export default SearchInput;
