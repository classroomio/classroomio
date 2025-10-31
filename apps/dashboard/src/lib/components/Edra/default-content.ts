export default {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: {
        textAlign: 'center',
        level: 1
      },
      content: [
        {
          type: 'text',
          text: 'Introducing ClassroomIO'
        }
      ]
    },
    {
      type: 'paragraph',
      attrs: {
        textAlign: 'justify',
        class: null
      },
      content: [
        {
          type: 'text',
          text: 'The AI native LMS. We have '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'bold'
            }
          ],
          text: 'bold'
        },
        {
          type: 'text',
          text: ', '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'italic'
            }
          ],
          text: 'italic'
        },
        {
          type: 'text',
          text: ', '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'strike'
            }
          ],
          text: 'strike'
        },
        {
          type: 'text',
          text: ', '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'underline'
            }
          ],
          text: 'underline'
        },
        {
          type: 'text',
          text: ', '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'link',
              attrs: {
                href: 'https://github.com',
                target: '_blank',
                rel: 'noopener noreferrer',
                class: null
              }
            }
          ],
          text: 'link'
        },
        {
          type: 'text',
          text: ', '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'code'
            }
          ],
          text: 'code'
        },
        {
          type: 'text',
          text: ', Superscript A'
        },
        {
          type: 'text',
          marks: [
            {
              type: 'superscript'
            }
          ],
          text: 'b'
        },
        {
          type: 'text',
          text: ', subscript A'
        },
        {
          type: 'text',
          marks: [
            {
              type: 'subscript'
            }
          ],
          text: 'b'
        },
        {
          type: 'text',
          text: ', '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'highlight',
              attrs: {
                color: '#800080'
              }
            }
          ],
          text: 'highlight1'
        },
        {
          type: 'text',
          marks: [
            {
              type: 'highlight',
              attrs: {
                color: '#1a1600'
              }
            }
          ],
          text: ','
        },
        {
          type: 'text',
          text: ' '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'highlight',
              attrs: {
                color: '#0000FF'
              }
            }
          ],
          text: 'highlight2'
        },
        {
          type: 'text',
          text: ', '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'textStyle',
              attrs: {
                color: '#008000',
                fontSize: ''
              }
            }
          ],
          text: 'textcolor1'
        },
        {
          type: 'text',
          marks: [
            {
              type: 'textStyle',
              attrs: {
                color: 'rgb(78, 211, 21)',
                fontSize: ''
              }
            }
          ],
          text: ', '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'textStyle',
              attrs: {
                color: '#FFA500',
                fontSize: ''
              }
            }
          ],
          text: 'textcolor2'
        }
      ]
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          attrs: {
            textAlign: 'justify',
            class: null
          },
          content: [
            {
              type: 'text',
              text: 'This is a block Quote'
            }
          ]
        }
      ]
    },
    {
      type: 'codeBlock',
      attrs: {
        language: 'javascript'
      },
      content: [
        {
          type: 'text',
          text: 'console.log("Hello World")'
        }
      ]
    },
    {
      type: 'horizontalRule'
    },
    {
      type: 'heading',
      attrs: {
        textAlign: 'left',
        level: 2
      },
      content: [
        {
          type: 'text',
          text: 'Support For Media Placeholders and Medias'
        }
      ]
    },
    {
      type: 'image-placeholder'
    },
    {
      type: 'image',
      attrs: {
        src: 'https://placehold.co/800x400/6A00F5/white',
        alt: null,
        title: 'A Sample Image',
        width: 658,
        height: null,
        align: 'center'
      }
    },
    {
      type: 'video-placeholder'
    },
    {
      type: 'video',
      attrs: {
        src: 'https://videos.pexels.com/video-files/2491284/2491284-uhd_2732_1440_24fps.mp4',
        alt: null,
        title: 'A Sample Video',
        width: 673,
        height: null,
        align: 'center'
      }
    },
    {
      type: 'audio-placeholder'
    },
    {
      type: 'audio',
      attrs: {
        src: 'https://cdn.pixabay.com/audio/2024/10/30/audio_42e6870f29.mp3',
        alt: null,
        title: 'A Sample Audio',
        width: 670,
        height: null,
        align: 'center'
      }
    },
    {
      type: 'horizontalRule'
    },
    {
      type: 'heading',
      attrs: {
        textAlign: null,
        level: 2
      },
      content: [
        {
          type: 'text',
          text: 'IFrames'
        }
      ]
    },
    {
      type: 'iframe-placeholder'
    },
    {
      type: 'iframe',
      attrs: {
        src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3748.5645078258503!2d75.17451197505285!3d20.026784381383496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdb93bd138ae4bd%3A0x574c6482cf0b89cf!2sEllora%20Caves!5e0!3m2!1sen!2sin!4v1742466514831!5m2!1sen!2sin',
        alt: null,
        title: 'Ellora Caves, Maharastra, India',
        width: 621,
        height: null,
        align: 'center'
      }
    },
    {
      type: 'iframe',
      attrs: {
        src: 'https://www.youtube.com/embed/jfKfPfyJRdk?si=SYBE0PkI5v79-54W',
        alt: null,
        title: 'Lofi Hip Hop Youtube Streaming Video',
        width: 623,
        height: null,
        align: 'center'
      }
    },
    {
      type: 'paragraph',
      attrs: {
        textAlign: null,
        class: null
      }
    },
    {
      type: 'horizontalRule'
    },
    {
      type: 'heading',
      attrs: {
        textAlign: null,
        level: 2
      },
      content: [
        {
          type: 'text',
          text: 'Typography'
        }
      ]
    },
    {
      type: 'paragraph',
      attrs: {
        textAlign: null,
        class: null
      },
      content: [
        {
          type: 'text',
          text: 'Smilipicker, type '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'code'
            }
          ],
          text: ':)'
        },
        {
          type: 'text',
          text: ' and it becomes 🙂 or 😉. Typography support e.g. type '
        },
        {
          type: 'text',
          marks: [
            {
              type: 'code'
            }
          ],
          text: '!='
        },
        {
          type: 'text',
          text: ' and it becomes ≠. Similarly (c) becomes ©, -> becomes → and many more like 1×2, ½. We also have color visualizer. #FFF, #000, #FF00FF can be visualized.'
        }
      ]
    },
    {
      type: 'horizontalRule'
    },
    {
      type: 'heading',
      attrs: {
        textAlign: null,
        level: 2
      },
      content: [
        {
          type: 'text',
          text: 'Tables'
        }
      ]
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              attrs: {
                colspan: 1,
                rowspan: 1,
                colwidth: [323],
                style: null
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    textAlign: null,
                    class: null
                  },
                  content: [
                    {
                      type: 'text',
                      text: 'Hello World'
                    }
                  ]
                }
              ]
            },
            {
              type: 'tableCell',
              attrs: {
                colspan: 1,
                rowspan: 1,
                colwidth: [328],
                style: null
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    textAlign: null,
                    class: null
                  },
                  content: [
                    {
                      type: 'text',
                      text: 'Hello World'
                    }
                  ]
                }
              ]
            },
            {
              type: 'tableCell',
              attrs: {
                colspan: 1,
                rowspan: 1,
                colwidth: [330],
                style: null
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    textAlign: null,
                    class: null
                  },
                  content: [
                    {
                      type: 'text',
                      text: 'Hello World'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              attrs: {
                colspan: 1,
                rowspan: 1,
                colwidth: [323],
                style: null
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    textAlign: null,
                    class: null
                  },
                  content: [
                    {
                      type: 'text',
                      text: 'Hello World'
                    }
                  ]
                }
              ]
            },
            {
              type: 'tableCell',
              attrs: {
                colspan: 1,
                rowspan: 1,
                colwidth: [328],
                style: null
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    textAlign: null,
                    class: null
                  },
                  content: [
                    {
                      type: 'text',
                      text: 'Hello World'
                    }
                  ]
                }
              ]
            },
            {
              type: 'tableCell',
              attrs: {
                colspan: 1,
                rowspan: 1,
                colwidth: [330],
                style: null
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    textAlign: null,
                    class: null
                  },
                  content: [
                    {
                      type: 'text',
                      text: 'Hello World'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      type: 'heading',
      attrs: {
        textAlign: null,
        level: 3
      },
      content: [
        {
          type: 'text',
          marks: [
            {
              type: 'textStyle',
              attrs: {
                color: 'var(--tw-prose-headings)',
                fontSize: '1.5em'
              }
            }
          ],
          text: 'Rending Math and '
        },
        {
          type: 'inlineMath',
          attrs: {
            latex: '\\LaTeX',
            evaluate: 'no',
            display: 'no'
          }
        }
      ]
    },
    {
      type: 'paragraph',
      attrs: {
        textAlign: null,
        class: null
      },
      content: [
        {
          type: 'text',
          text: 'The editor supports the '
        },
        {
          type: 'inlineMath',
          attrs: {
            latex: '\\LaTeX',
            evaluate: 'no',
            display: 'no'
          }
        },
        {
          type: 'text',
          text: ' rendering. e.g.'
        }
      ]
    },
    {
      type: 'orderedList',
      attrs: {
        start: 1
      },
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              attrs: {
                textAlign: null,
                class: null
              },
              content: [
                {
                  type: 'text',
                  text: 'Functions like, '
                },
                {
                  type: 'inlineMath',
                  attrs: {
                    latex: 'sin²\\theta + cos²\\theta=1, a²+b²=c²',
                    evaluate: 'no',
                    display: 'no'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              attrs: {
                textAlign: null,
                class: null
              },
              content: [
                {
                  type: 'text',
                  text: 'Matrix like unit matrix'
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: {
                textAlign: null,
                class: null
              },
              content: [
                {
                  type: 'inlineMath',
                  attrs: {
                    latex: '\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}',
                    evaluate: 'no',
                    display: 'no'
                  }
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: {
                textAlign: null,
                class: null
              },
              content: [
                {
                  type: 'text',
                  text: 'or more matrices like'
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: {
                textAlign: null,
                class: null
              },
              content: [
                {
                  type: 'inlineMath',
                  attrs: {
                    latex:
                      '\\begin{pmatrix} 1 & 0 & \\cdots & 0 \\\\ 0 & 1 & \\cdots & 0 \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ 0 & 0 & \\cdots & 1 \\end{pmatrix}',
                    evaluate: 'no',
                    display: 'no'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              attrs: {
                textAlign: null,
                class: null
              },
              content: [
                {
                  type: 'text',
                  text: 'Integrals and differential'
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: {
                textAlign: null,
                class: null
              },
              content: [
                {
                  type: 'inlineMath',
                  attrs: {
                    latex:
                      '\\int_{0}^{\\frac{\\pi}{2}} \\sin(x) \\,dx = \\left[-\\cos(x)\\right]_0^{\\frac{\\pi}{2}} = -\\cos\\left(\\frac{\\pi}{2}\\right) + \\cos(0)',
                    evaluate: 'no',
                    display: 'no'
                  }
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: {
                textAlign: null,
                class: null
              },
              content: [
                {
                  type: 'inlineMath',
                  attrs: {
                    latex: '\\frac{\\mathrm{d}}{\\mathrm{d}x}(\\sin x) = \\cos x',
                    evaluate: 'no',
                    display: 'no'
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      type: 'heading',
      attrs: {
        textAlign: null,
        level: 3
      },
      content: [
        {
          type: 'text',
          text: 'Explore More…'
        }
      ]
    },
    {
      type: 'paragraph',
      attrs: {
        textAlign: null,
        class: null
      }
    },
    {
      type: 'paragraph',
      attrs: {
        textAlign: null,
        class: null
      }
    }
  ]
};
