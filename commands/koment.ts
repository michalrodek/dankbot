import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces.js";
import { myFetch } from "../utils.js";

interface Comment {
  data: {
    discussions: {
      edges: {
        cursor: string;
        node: {
          id: string;
          title: string;
          isClosed: boolean;
          createdDate: string;
          canonicalString: string;
          commentsCount: number;
          comments: {
            edges: {
              node: {
                id: string;
                content: string;
                createdDate: string;
                reactionsCount: {
                  count: number;
                  reactionType: {
                    name: ReactionName;
                  };
                }[];
                user: {
                  profilName: string;
                  profilLink: string;
                  profilImage: string;
                };
              };
            }[];
          };
          service: {
            title: string;
          };
        };
      }[];
    };
  };
}

interface FlattenComment extends Reactions {
  content: string;
  date: string;
  name: string;
  title: string;
}

type ReactionName = "angry" | "heart" | "laugh" | "shock" | "cry";
type Reactions = Record<ReactionName, number>;

const cache: Comment[] = [];
const cacheTime = 5;
let dateTo = 0;

const Koment: Command = {
  data: new SlashCommandBuilder()
    .setName("koment")
    .setDescription("Random blitek (puke)"),
  execute: async (interaction) => {
    await interaction.deferReply();

    if (dateTo < Date.now()) {
      const zpravyData = await myFetch<Comment>(
        "https://diskuze.seznam.cz/graphql",
        "data",
        fetchOptions("zpravy")
      );

      const novinkyData = await myFetch<Comment>(
        "https://diskuze.seznam.cz/graphql",
        "data",
        fetchOptions("novinky")
      );

      if (!zpravyData.data || !novinkyData.data) {
        await interaction.editReply("error");

        return;
      }

      cache.push(zpravyData.data, novinkyData.data);

      const date = Date.now();

      dateTo = new Date(date).setMinutes(
        new Date(date).getMinutes() + cacheTime
      );
    }

    let zpravyData = cache[0];
    let novinkyData = cache[1];

    const flattenComments: FlattenComment[] = [];

    [zpravyData, novinkyData].forEach((server) =>
      server.data.discussions.edges.forEach((discussion) =>
        discussion.node.comments.edges.forEach((comment) => {
          const reactions: Reactions = {
            angry: 0,
            cry: 0,
            heart: 0,
            laugh: 0,
            shock: 0,
          };

          comment.node.reactionsCount.map((reaction) => {
            reactions[reaction.reactionType.name] = reaction.count;
          });

          flattenComments.push({
            ...reactions,
            content: comment.node.content,
            date: comment.node.createdDate,
            name: comment.node.user.profilName,
            title: discussion.node.title,
          });
        })
      )
    );

    const sortedComments = flattenComments.sort((a, b) => {
      if (a.angry == null) a.angry = 0;
      if (b.angry == null) b.angry = 0;

      if (a.angry > b.angry) {
        return -1;
      }

      if (a.angry < b.angry) {
        return 1;
      }

      return 0;
    });

    const comment = sortedComments[randomNumber(20)];

    const embed = new EmbedBuilder()
      .setTitle(comment.name)
      .setDescription(comment.content)
      .setAuthor({ name: comment.title })
      .setTimestamp(new Date(comment.date))
      .setColor("#b00205")
      .addFields([
        {
          name: String(comment.angry),
          value: ":angry:",
          inline: true,
        },
        {
          name: String(comment.heart),
          value: ":heart:",
          inline: true,
        },
        {
          name: String(comment.laugh),
          value: ":smile:",
          inline: true,
        },
        {
          name: String(comment.shock),
          value: ":scream:",
          inline: true,
        },
        {
          name: String(comment.cry),
          value: ":cry:",
          inline: true,
        },
      ]);

    await interaction.editReply({ embeds: [embed] });
  },
};

export default Koment;

function randomNumber(maxNumber: number) {
  return Math.floor(Math.random() * maxNumber);
}

function fetchOptions(server: string) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
      query Discussions {
        discussions(sort: CREATED_DATE_DESC, serviceName: "${server}", first: 50) {
          edges {
            cursor
            node {
              id
              title
              isClosed
              createdDate
              canonicalString
              commentsCount
              comments(sort: SCORE_DESC) {
                edges {
                  node {
                    id
                    content
                    createdDate
                    reactionsCount {
                      count
                      reactionType {
                        name
                      }
                    }
                    user {
                      profilName
                      profilLink
                      profilImage
                    }
                  }
                }
              }
              service {
                title
              }
            }
          }
        }
      }
      `,
    }),
  };
}
