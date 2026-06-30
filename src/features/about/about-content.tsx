import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Alert, Button, Card, Column, Container, EmptyState, Flex, Grid, Heading, Row, Text } from '@components/core';
import { tokens } from '@locales/index';
import {
  LoadingSpinner,
  Pagination,
  PokemonDetail,
  PokemonGrid,
  SearchInput,
} from './components';
import { useGetPokemon, useGetPokemonList } from './hooks';

const ITEMS_PER_PAGE = 12;

const AboutContent: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate offset based on current page
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch pokemon list using custom hook (RTK Query)
  const {
    data: pokemonList,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    refetch: refetchList,
  } = useGetPokemonList({ limit: ITEMS_PER_PAGE, offset });

  // Fetch single pokemon details
  const {
    data: pokemonDetail,
    isLoading: isDetailLoading,
    isFetching: isDetailFetching,
  } = useGetPokemon({
    nameOrId: selectedPokemon ?? undefined,
    skip: !selectedPokemon,
  });

  // Calculate total pages
  const totalPages = pokemonList
    ? Math.ceil(pokemonList.count / ITEMS_PER_PAGE)
    : 0;

  // Filter pokemon by search term
  const filteredPokemon = useMemo(() => {
    if (!pokemonList?.results) return [];
    if (!searchTerm.trim()) return pokemonList.results;

    return pokemonList.results.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pokemonList?.results, searchTerm]);

  const handleSelectPokemon = (name: string) => {
    setSelectedPokemon(name);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedPokemon(null);
    setSearchTerm('');
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  return (
    <Container size="lg" className="py-8">
      <Heading as="h1" size="3xl" className="mb-4">
        {t(tokens.about.title)}
      </Heading>
      <Text size="lg" color="muted" className="mb-2">
        {t(tokens.about.subtitle)}{' '}
        <Button variant="ghost" size="sm" onClick={() => window.open('https://pokeapi.co/', '_blank')}>
          PokéAPI
        </Button>
        .
      </Text>
      <Text size="sm" color="muted" className="mb-8">
        {t(tokens.about.subtitle2)}
      </Text>

      <Grid cols={1} colsLg={3} gap="xl">
        {/* Pokemon List */}
        <Column gap="md" className="lg:col-span-2">
          {/* Header with Search and Refresh */}
          <Flex
            direction="col"
            gap="md"
            className="sm:flex-row sm:items-center sm:justify-between"
          >
            <Heading as="h2" size="xl">
              {t(tokens.about.pokemonList)}
            </Heading>
            <Row gap="sm">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={t(tokens.about.searchPlaceholder)}
              />
              <Button
                onClick={() => refetchList()}
                disabled={isListFetching}
                isLoading={isListFetching}
                size="md"
              >
                {t(tokens.common.refresh)}
              </Button>
            </Row>
          </Flex>

          {/* Loading State */}
          {isListLoading && <LoadingSpinner message={t(tokens.about.loadingPokemon)} />}

          {/* Error State */}
          {isListError && (
            <Alert variant="error">
              {t(tokens.about.failedToLoad)}
            </Alert>
          )}

          {/* Pokemon Grid */}
          {pokemonList && !isListLoading && (
            <>
              {/* Results info */}
              <Text size="sm" color="muted" className="mb-4">
                {t(tokens.about.showing)} {offset + 1}-
                {Math.min(offset + ITEMS_PER_PAGE, pokemonList.count)} {t(tokens.about.of)}{' '}
                {pokemonList.count} {t(tokens.about.pokemon)}
                {searchTerm &&
                  ` (${filteredPokemon.length} ${filteredPokemon.length !== 1 ? t(tokens.about.matches) : t(tokens.about.match)} ${t(tokens.about.onThisPage)})`}
              </Text>

              {/* No Results */}
              {filteredPokemon.length === 0 && searchTerm ? (
                <Card variant="default">
                  <EmptyState
                    title={`${t(tokens.about.noPokemonFound)} "${searchTerm}"`}
                    description={t(tokens.about.tryDifferentSearch)}
                  />
                </Card>
              ) : (
                <PokemonGrid
                  pokemon={filteredPokemon}
                  selectedPokemon={selectedPokemon}
                  onSelectPokemon={handleSelectPokemon}
                />
              )}

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
                isLoading={isListFetching}
              />
            </>
          )}
        </Column>

        {/* Pokemon Detail */}
        <Column gap="md" className="lg:col-span-1">
          <Heading as="h2" size="xl">
            {t(tokens.about.pokemonDetails)}
          </Heading>

          {!selectedPokemon && (
            <Card variant="default">
              <EmptyState
                title={t(tokens.about.noPokemonSelected)}
                description={t(tokens.about.selectPokemon)}
              />
            </Card>
          )}

          {selectedPokemon && (isDetailLoading || isDetailFetching) && (
            <Card variant="default">
              <LoadingSpinner />
            </Card>
          )}

          {pokemonDetail && !isDetailLoading && !isDetailFetching && (
            <PokemonDetail pokemon={pokemonDetail} />
          )}
        </Column>
      </Grid>

      {/* Back Link */}
      <Row justify="center" className="mt-12">
        <Button variant="outline" onClick={() => navigate('/')}>
          {t(tokens.about.backToHome)}
        </Button>
      </Row>
    </Container>
  );
};

export default AboutContent;
