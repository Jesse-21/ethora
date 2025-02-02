import React, { useEffect, useState } from "react";
import {
  getExplorerBlocks,
  getExplorerHistory,
  getTransactions,
} from "../../http";
import { useStoreState } from "../../store";
import { ExplorerChart } from "../../componets/ExplorerChart";
import { format } from "date-fns";
import {
  ExplorerRespose,
  IBlock,
  IHistory,
  ITransaction,
} from "../Profile/types";
import { FullPageSpinner } from "../../componets/FullPageSpinner";
import { ExplorerBlocks } from "../../componets/ExplorerBlocks";
import { Box, styled, Typography } from "@mui/material";
import { Transactions } from "../Transactions/Transactions";

const Container = styled(Box)(({ theme }) => ({
  width: "100vw",
  padding: 20,
  display: "flex",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

export type TChartData = { date: string; y: number }[];

const transformDataForChart = (data: IHistory): TChartData => {
  const result: TChartData = [];
  for (let index = 0; index < data.x.length; index++) {
    const elementX = format(new Date(data.x[index]), "MMMM dd yyyy");
    const elementY = data.y[index];
    result.push({ date: elementX, y: elementY });
  }
  return result;
};

export default function Explorer() {
  const user = useStoreState((store) => store.user);
  const [transactions, setTransactions] = useState<
    ExplorerRespose<ITransaction[]>
  >({
    limit: 0,
    offset: 0,
    items: [],
    total: 0,
  });
  const [explorerHistory, setExplorerHistory] = useState<TChartData | []>([]);
  const [loading, setLoading] = useState(false);
  const [explorerBlocks, setExplorerBlocks] = useState<
    ExplorerRespose<IBlock[]>
  >({ limit: 0, offset: 0, items: [], total: 0 });

  const getState = async () => {
    setLoading(true);
    try {
      const { data } = await getTransactions(user.walletAddress);
      const { data: history } = await getExplorerHistory();
      const { data: blocks } = await getExplorerBlocks();
      const transformedHistory = transformDataForChart(history);
      setExplorerHistory(transformedHistory);
      setTransactions(data);
      setExplorerBlocks(blocks);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };
  useEffect(() => {
    getState();
  }, []);

  if (loading) {
    return <FullPageSpinner />;
  }
  return (
    <Box>
      {!!user.token && (
        <Container>
          <Box sx={{ maxWidth: 500 }}>
            <ExplorerBlocks blocks={explorerBlocks.items} />
          </Box>
          <Box sx={{ height: 300, width: "100%" }}>
            <ExplorerChart data={explorerHistory} />
          </Box>
        </Container>
      )}
      <Typography variant="h6" sx={{ margin: "16px" }}>
        Transactions
      </Typography>
      <Transactions transactions={transactions.items} />
    </Box>
  );
}
